const { bedrock } = require("@ai-sdk/amazon-bedrock");
const { streamText } = require("ai");
const { createMCPClient } = require("@ai-sdk/mcp");
const { CognitoIdentityProviderClient, InitiateAuthCommand } = require("@aws-sdk/client-cognito-identity-provider");

// --- Cognito Auth Logic ---

let _client = null;
function getClient() {
    if (!_client) {
        _client = new CognitoIdentityProviderClient({
            region: (process.env.AWS_REGION || "us-east-1").replace(/"/g, ''),
            maxAttempts: 2,
        });
    }
    return _client;
}

let tokenCache = null;

async function getCognitoToken() {
    const now = Math.floor(Date.now() / 1000);
    if (tokenCache && tokenCache.expiresAt > now + 300) {
        return tokenCache.token;
    }

    console.log("[Auth] Refreshing Cognito Token for Lambda...");
    const clientId = process.env.COGNITO_CLIENT_ID?.replace(/"/g, '');
    const username = process.env.COGNITO_USERNAME?.replace(/"/g, '');
    const password = process.env.COGNITO_PASSWORD?.replace(/"/g, '');

    if (!clientId || !username || !password) {
        throw new Error("Missing Cognito credentials in environment variables");
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
        const response = await client.send(command);

        if (!response.AuthenticationResult) {
            throw new Error("Failed to get authentication result from Cognito");
        }

        // AgentCore's client_id check specifically requires the AccessToken's client_id claim
        const token = response.AuthenticationResult.AccessToken;
        const expiresIn = response.AuthenticationResult.ExpiresIn || 3600;

        tokenCache = {
            token: token,
            expiresAt: now + expiresIn,
        };

        console.log(`[Auth] Login successful. Using AccessToken (Required for AgentCore client_id check).`);
        return token;
    } catch (error) {
        console.error("Cognito Auth Error (Lambda):", error);
        throw error;
    }
}

// --- MCP Toolkit Logic ---

let toolCache = null;
const TOOL_CACHE_TTL = 3600 * 1000;

async function getMCPToolkit() {
    const now = Date.now();
    if (toolCache && toolCache.expiresAt > now) {
        return toolCache.tools;
    }

    console.log("[MCP] Fetching MCP Tools from remote (Lambda)...");
    const token = await getCognitoToken();
    const mcpServerUrl = process.env.MCP_SERVER_URL?.replace(/"/g, '');

    if (!mcpServerUrl) {
        throw new Error("Missing MCP_SERVER_URL environment variable");
    }

    try {
        const mcpClient = await createMCPClient({
            transport: {
                type: "http",
                url: mcpServerUrl,
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
            },
        });

        const tools = await mcpClient.tools();
        console.log(`[MCP] Successfully loaded ${Object.keys(tools).length} tools.`);

        toolCache = {
            tools,
            expiresAt: now + TOOL_CACHE_TTL,
        };

        return tools;
    } catch (mcpError) {
        console.error("[MCP] Transport Error:", mcpError.message);
        throw mcpError;
    }
}

// --- Main Handler ---

exports.handler = async (event) => {
    const httpMethod = event.requestContext && event.requestContext.http ? event.requestContext.http.method : "POST";
    if (httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const body = JSON.parse(event.body);
        const { messages: rawMessages } = body;

        // AI_LOGIC_SYNC_START
        // Normalize messages for Vercel AI SDK CoreMessage format
                // AI_LOGIC_SYNC_START
                const messages = rawMessages.map((m) => {
                    const role = m.role === "data" ? "user" : m.role;

                    if (Array.isArray(m.parts)) {
                        const content = m.parts
                            .map((p) => {
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

        // 2. Use streamText
        const result = await streamText({
            model: bedrock("amazon.nova-micro-v1:0"),
            system,
            messages,
            tools: tools,
            maxSteps: 5,
        });

        const streamResponse = result.toUIMessageStreamResponse();

        return {
            statusCode: streamResponse.status,
            headers: {
                ...Object.fromEntries(streamResponse.headers.entries()),
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization"
            },
            body: await streamResponse.text(),
        };

    } catch (error) {
        console.error("Orchestrator Error:", error);
        return {
            statusCode: 500,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ error: error.message }),
        };
    }
};
