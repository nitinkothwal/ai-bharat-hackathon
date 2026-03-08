import { bedrock } from "@ai-sdk/amazon-bedrock";
import { streamText } from "ai";
import { createMCPClient } from "@ai-sdk/mcp";
import { CognitoIdentityProviderClient, InitiateAuthCommand } from "@aws-sdk/client-cognito-identity-provider";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;
export const dynamic = "force-dynamic";

// --- Cognito Auth Logic ---

let _client: CognitoIdentityProviderClient | null = null;
function getClient() {
    if (!_client) {
        _client = new CognitoIdentityProviderClient({
            region: (process.env.AWS_REGION || "us-east-1").replace(/"/g, ''),
            maxAttempts: 2,
        });
    }
    return _client;
}

interface TokenCache {
    token: string;
    expiresAt: number;
}

let tokenCache: TokenCache | null = null;

async function getCognitoToken() {
    const now = Math.floor(Date.now() / 1000);

    if (tokenCache && tokenCache.expiresAt > now + 300) {
        return tokenCache.token;
    }

    console.log("[Auth] Refreshing Cognito Token...");

    const clientId = process.env.COGNITO_CLIENT_ID?.replace(/"/g, '');
    const username = process.env.COGNITO_USERNAME?.replace(/"/g, '');
    const password = process.env.COGNITO_PASSWORD?.replace(/"/g, '');

    if (!clientId || !username || !password) {
        throw new Error(`Auth Config Error: Missing Cognito credentials in .env.local`);
    }

    const command = new InitiateAuthCommand({
        AuthFlow: "USER_PASSWORD_AUTH",
        ClientId: clientId,
        AuthParameters: {
            USERNAME: username,
            PASSWORD: password,
        },
    });

    try {
        const client = getClient();
        console.log(`[Auth] Attempting login for ${username}...`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const response = await client.send(command, { abortSignal: controller.signal });
        clearTimeout(timeoutId);

        if (response.ChallengeName) {
            throw new Error(`Cognito Challenge Required: ${response.ChallengeName}`);
        }

        if (!response.AuthenticationResult) {
            throw new Error("Cognito Response Error: AuthenticationResult missing.");
        }

        // Use IdToken if available (standard for OIDC), otherwise AccessToken
        const token = response.AuthenticationResult.IdToken || response.AuthenticationResult.AccessToken;
        if (!token) throw new Error("No token found in Cognito response");

        const expiresIn = response.AuthenticationResult.ExpiresIn || 3600;

        tokenCache = {
            token: token,
            expiresAt: now + expiresIn,
        };

        console.log(`[Auth] Login successful. Using ${response.AuthenticationResult.IdToken ? 'IdToken' : 'AccessToken'}.`);
        return token;
    } catch (error: any) {
        console.error("[Auth] Cognito Login Failed:", error.name, error.message);
        throw error;
    }
}

// --- MCP Toolkit Logic ---

interface ToolCache {
    tools: any;
    expiresAt: number;
}

let toolCache: ToolCache | null = null;
const TOOL_CACHE_TTL = 3600 * 1000;

async function getMCPToolkit() {
    const now = Date.now();

    if (toolCache && toolCache.expiresAt > now) {
        return toolCache.tools;
    }

    console.log("[MCP] Fetching MCP Tools from remote...");

    const token = await getCognitoToken();
    const mcpServerUrl = process.env.MCP_SERVER_URL?.replace(/"/g, '');

    if (!mcpServerUrl) {
        throw new Error("Missing MCP_SERVER_URL environment variable in .env.local");
    }

    try {
        console.log(`[MCP] Connecting to AgentCore at: ${mcpServerUrl}`);

        const mcpClient = await createMCPClient({
            transport: {
                type: "http",
                url: mcpServerUrl,
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
            },
        });

        const toolsPromise = mcpClient.tools();
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("MCP_TOOLS_FETCH_TIMEOUT")), 15000)
        );

        console.log("[MCP] Loading tool definitions...");
        const tools = await Promise.race([toolsPromise, timeoutPromise]);

        toolCache = {
            tools,
            expiresAt: now + TOOL_CACHE_TTL,
        };

        console.log(`[MCP] Successfully loaded ${Object.keys(tools as any).length} tools.`);
        return tools;
    } catch (error: any) {
        console.error("[MCP] Transport Error:", error.message);
        if (error.message.includes("401")) {
            throw new Error(`MCP Auth Failed (401): Check Cognito Client ID in AgentCore. ${error.message}`);
        }
        throw error;
    }
}

// --- Main Chat Route ---

export async function POST(req: Request) {
    try {
        const { messages: rawMessages } = await req.json();
        console.log("MESSAGES RECEIVED:", JSON.stringify(rawMessages, null, 2));

        // Normalize messages for Vercel AI SDK CoreMessage format
        // AI_LOGIC_SYNC_START
        const messages = rawMessages.map((m: any) => {
            const role = m.role === "data" ? "user" : m.role;

            if (Array.isArray(m.parts)) {
                const content = m.parts
                    .map((p: any) => {
                        if (p.type === 'text') {
                            return { type: 'text', text: p.text };
                        }
                        return null;
                    })
                    .filter(Boolean);

                return {
                    role,
                    content: content.length > 0 ? content : (typeof m.content === 'string' ? m.content : ""),
                };
            }

            return {
                role,
                content: m.content || "",
            };
        });

        // Add a system prompt to guide the AI
        const system = "You are BharatCare Link Assistant, a helpful medical coordinator. " +
            "You can register patients, list them, and manage referrals via tools. " +
            "Always be professional and concise.";
        // AI_LOGIC_SYNC_END

        console.log("1. Initializing Authenticated MCP Toolkit...");
        const tools = await getMCPToolkit();
        console.log("Found tools:", Object.keys(tools));

        console.log("3. Calling Bedrock (Nova Micro)...");
        try {
            const result = await streamText({
                model: bedrock("amazon.nova-micro-v1:0"),
                system,
                messages,
                tools: tools,
                // @ts-ignore
                maxSteps: 5,
                onFinish: (event) => {
                    console.log("Stream Finished. Reason:", event.finishReason);
                },
                onError: (error) => {
                    console.error("Stream Error (inside streamText):", error);
                },
            });

            console.log("4. Returning UI Message Stream Response...");
            return result.toUIMessageStreamResponse();
        } catch (streamError: any) {
            console.error("Error creating stream:", streamError);
            return new Response(JSON.stringify({ error: streamError.message }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    } catch (error: any) {
        console.error("Chat API Critical Error:", error);
        return new Response(error.message || "Internal Server Error", { status: 500 });
    }
}
