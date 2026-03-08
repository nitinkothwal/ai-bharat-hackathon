# Bharat CareLink – System Design Specification

**Version:** 1.1  
**Status:** Active Development  
**Last Updated:** March 2026  

---

## Table of Contents
1. [High-Level Architecture](#1-high-level-architecture)
2. [Component Design](#2-component-design)
3. [Data Architecture](#3-data-architecture)
4. [Infrastructure as Code](#4-infrastructure-as-code)
5. [Security Design](#5-security-design)
6. [Future Architecture Extensions](#6-future-architecture-extensions)

---

## 1. High-Level Architecture

### 1.1 Architecture Overview

BharatCare Link is a **100% serverless, cloud-native** application on AWS. There are no persistent servers. All compute is event-driven, and the infrastructure scales to zero on idle.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
│                                                                              │
│   ┌──────────────────────────────────────────────────────────┐               │
│   │   ASHA Web App  (Next.js SPA · ASHA Workers + PHC Staff) │               │
│   │   ┌────────────┐  ┌──────────────┐  ┌────────────────┐  │               │
│   │   │ AI Chat UI │  │ Patients Page│  │ Referrals Page │  │               │
│   │   └────────┬───┘  └──────┬───────┘  └───────┬────────┘  │               │
│   └────────────│─────────────│──────────────────│───────────┘               │
└────────────────│─────────────│──────────────────│───────────────────────────┘
                 │             │                  │  (HTTPS via CloudFront CDN)
                 ▼             ▼                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          EDGE & GATEWAY LAYER                                │
│                                                                              │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │  AWS CloudFront  (CDN · SPA routing · API path-based routing)        │  │
│   │  ┌──────────────────────┐    ┌────────────────────────────────────┐  │  │
│   │  │  S3 Origin (/*html)  │    │  API Gateway Origin (/api/*)       │  │  │
│   │  └──────────────────────┘    └───────────────┬────────────────────┘  │  │
│   └───────────────────────────────────────────────│───────────────────────┘  │
│                                                   │                          │
│   ┌───────────────────────────────────────────────┴────────────────────────┐ │
│   │  AWS API Gateway V2  (HTTP API)                                         │ │
│   │  ├── POST /api/chat    ──────── ChatOrchestratorFunction               │ │
│   │  └── GET  /api/records ──────── RecordsOrchestratorFunction            │ │
│   └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
                 │                              │
                 ▼                              ▼
┌──────────────────────────────┐  ┌────────────────────────────────────────────┐
│    CHAT ORCHESTRATION LAYER  │  │         RECORDS DATA LAYER                  │
│                              │  │                                             │
│  Lambda: chat-orchestrator   │  │  Lambda: records-orchestrator               │
│  ├─ Vercel AI SDK (streamText│  │  ├─ DynamoDB Scan: PatientsTable            │
│  ├─ Amazon Bedrock           │  │  └─ DynamoDB Scan: ReferralsTable           │
│  │  (amazon.nova-micro-v1:0) │  │                                             │
│  └─ MCP Client               │  └────────────────────────────────────────────┘
│     └─ HTTP Transport        │                      │
│        ─── Bearer Token ──▶  │              ┌───────▼──────────────┐
│                              │              │   Amazon DynamoDB     │
│  ┌───────────────────────┐   │              │  ┌───────────────────┐│
│  │  AWS Bedrock          │   │              │  │  PatientsTable    ││
│  │  AgentCore Runtime    │   │              │  │  ReferralsTable   ││
│  │                       │   │              │  └───────────────────┘│
│  │  MCP Server (FastMCP/ │   │              └──────────────────────┘
│  │  Python) deployed as  │   │
│  │  a managed runtime    │   │
│  │                       │   │
│  │  Exposed tools:       │   │
│  │  • register_patient   │   │
│  │  • create_referral    │   │
│  │  • list_patients      │   │
│  └─────────┬─────────────┘   │
│            │ ◀── Cognito     │
│            │    AccessToken  │
└────────────│─────────────────┘
             │
             ▼
    Amazon DynamoDB
   (PatientsTable + ReferralsTable)
```

---

### 1.2 End-to-End Request Flow: Chat (Patient Registration / Referral)

```
ASHA Worker                  CloudFront             API Gateway         Lambda (Chat)         AgentCore MCP          DynamoDB
    │                            │                      │                    │                     │                     │
    │ POST /api/chat             │                      │                    │                     │                     │
    │ {messages: [...]}          │                      │                    │                     │                     │
    │ ─────────────────────────▶│                      │                    │                     │                     │
    │                            │ Route /api/* to     │                    │                     │                     │
    │                            │ API Gateway Origin  │                    │                     │                     │
    │                            │ ────────────────────▶                   │                     │                     │
    │                            │                      │ Invoke Lambda    │                     │                     │
    │                            │                      │ ─────────────────▶                    │                     │
    │                            │                      │                    │ getCognitoToken()  │                     │
    │                            │                      │                    │ (AccessToken cache)│                     │
    │                            │                      │                    │                    │                     │
    │                            │                      │                    │ MCP HTTP POST      │                     │
    │                            │                      │                    │ Bearer {token}     │                     │
    │                            │                      │                    │ ───────────────────▶                    │
    │                            │                      │                    │                    │ Tool call:          │
    │                            │                      │                    │                    │ register_patient {} │
    │                            │                      │                    │                    │ ────────────────────▶
    │                            │                      │                    │                    │                     │ PutItem
    │                            │                      │                    │                    │◀────────────────────│
    │                            │                      │                    │◀───────────────────│                     │
    │                            │                      │                    │ stream response   │                     │
    │◀───────────────────────────────────────────────────────────────────────│                   │                     │
    │ (SSE stream chunks)        │                      │                    │                    │                     │
```

---

### 1.3 End-to-End Request Flow: Records Fetch

```
Browser (ASHA/PHC)           CloudFront             API Gateway       Lambda (Records)         DynamoDB
    │                            │                      │                    │                      │
    │ GET /api/records           │                      │                    │                      │
    │ ?type=patients             │                      │                    │                      │
    │ ─────────────────────────▶│                      │                    │                      │
    │                            │ ─────────────────────▶                   │                      │
    │                            │                      │ ──────────────────▶                      │
    │                            │                      │                    │ ScanCommand          │
    │                            │                      │                    │ (PatientsTable)      │
    │                            │                      │                    │ ─────────────────────▶
    │                            │                      │                    │◀─────────────────────│
    │                            │                      │                    │ {success, items:[]}  │
    │◀───────────────────────────────────────────────────────────────────────│                      │
    │ JSON response              │                      │                    │                      │
```

---

## 2. Component Design

### 2.1 Frontend: Asha Web App (Next.js)

**Technology Stack:**
| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Chat UI | `@assistant-ui/react` + `@assistant-ui/react-ai-sdk` |
| AI SDK | Vercel AI SDK (`ai`, `@ai-sdk/react`) |
| Icons | `lucide-react` |
| Build output | Static Export (`next export` → `out/`) |
| Hosting | AWS S3 + CloudFront |

**Application Structure:**
```
apps/asha-web/
├── app/
│   ├── layout.tsx         ← Root layout with Sidebar + SidebarProvider
│   ├── page.tsx           ← AI Chat page (MyAssistant component)
│   ├── patients/page.tsx  ← Registered Patients data table
│   ├── referrals/page.tsx ← All Referrals data table
│   └── api/
│       ├── chat/route.ts     ← Next.js API route → Bedrock + MCP (dev only)
│       └── records/route.ts  ← Next.js API route → DynamoDB (dev only)
├── components/
│   ├── Sidebar.tsx        ← Collapsible sidebar with navigation
│   ├── DataTable.tsx      ← Reusable table with client-side filter/sort
│   ├── MyAssistant.tsx    ← Chat interface wrapper
│   └── ToolCards.tsx      ← Feature cards on chat page
```

> **Note on API Routes:** In production, `app/api/` routes are excluded from the static export. All `/api/*` traffic is routed by CloudFront to AWS API Gateway, which invokes dedicated Lambda functions. The Next.js API routes exist solely for local development convenience.

**Chat UI Flow (frontend):**
1. User types message → `useChat()` hook (Vercel AI SDK) sends `POST /api/chat`.
2. Response streams back as Server-Sent Events (SSE).
3. `<AssistantUI>` from `@assistant-ui/react` renders each stream chunk incrementally.
4. Tool invocations are displayed as structured cards via `ToolCards.tsx`.

---

### 2.2 Chat Orchestrator Lambda

**Function Name:** `ai-bharat-care-link-chat-orchestrator-dev`  
**Runtime:** Node.js 22.x  
**Memory:** 1024 MB  
**Timeout:** 30 seconds  

**Responsibilities:**
1. Parse the incoming message list from the API Gateway event.
2. Retrieve a valid **Cognito AccessToken** (cached in memory for up to expiry − 5 minutes).
3. Use `@ai-sdk/mcp` to connect to the **AgentCore MCP Server** over HTTP transport, passing the Bearer token.
4. Load available tools from the MCP server (`mcpClient.tools()`), cached for 1 hour.
5. Call **Vercel AI SDK `streamText()`** with the Bedrock model, messages, and MCP tools.
6. Return the stream response as a UI Message Stream compatible with `@assistant-ui/react`.

**Key Libraries:**
- `@ai-sdk/amazon-bedrock` — Bedrock model adapter.
- `@ai-sdk/mcp` — MCP client with HTTP transport.
- `ai` (Vercel AI SDK) — Core `streamText()` and response helpers.
- `@aws-sdk/client-cognito-identity-provider` — Cognito token fetching.

**Environment Variables:**
| Variable | Description |
|----------|-------------|
| `MCP_SERVER_URL` | AWS Bedrock AgentCore Runtime invocation URL |
| `COGNITO_CLIENT_ID` | Cognito App Client ID |
| `COGNITO_USERNAME` | Service account username (ASHA system user) |
| `COGNITO_PASSWORD` | Service account password |
| `PATIENTS_TABLE` | DynamoDB Patients table name (injected by CloudFormation) |
| `REFERRALS_TABLE` | DynamoDB Referrals table name (injected by CloudFormation) |

---

### 2.3 AWS Bedrock AgentCore Runtime (MCP Server)

The **MCP Server** is the intelligence and data-access layer. It is deployed as a managed runtime on **AWS Bedrock AgentCore** — a fully managed hosting service for MCP servers that provides:
- Automatic scaling.
- AWS-native IAM-compatible identity (Cognito-based token validation).
- HTTPS endpoint with `Bearer` token authentication.

**Runtime Details:**
| Property | Value |
|----------|-------|
| Runtime | AWS Bedrock AgentCore Runtime |
| Runtime ID | `HealthcareMCP-k6TrCW8UIz` |
| Framework | FastMCP (Python) |
| Transport | HTTP (MCP over HTTPS) |
| Auth | Cognito User Pool (AccessToken claim validation) |
| Deployment | Docker image pushed to ECR, referenced by AgentCore |

**MCP Tools Exposed:**

| Tool Name | Description | DynamoDB Operation |
|-----------|-------------|-------------------|
| `register_patient` | Registers a new patient with demographics and condition | `PutItem` → PatientsTable |
| `create_referral` | Creates a referral linking a patient to a specialist | `PutItem` → ReferralsTable |
| `list_patients` | Returns a list of registered patients | `Scan` → PatientsTable |

**Authentication Flow:**
1. Chat Orchestrator Lambda calls Cognito with service-account credentials → receives `AccessToken`.
2. Lambda attaches `Authorization: Bearer {AccessToken}` to every MCP HTTP request.
3. AgentCore Runtime validates the token against the Cognito User Pool.
4. The `client_id` claim in the AccessToken must match the configured Cognito App Client ID.

> **Design Note:** The system uses `AccessToken` (not `IdToken`) because AgentCore's token validator specifically checks the `client_id` claim, which is only present in `AccessToken`.

---

### 2.4 Records Orchestrator Lambda

**Function Name:** `ai-bharat-care-link-records-orchestrator-dev`  
**Runtime:** Node.js 18.x  
**Timeout:** 30 seconds  

**Responsibilities:**
1. Read the `type` query parameter (`patients` or `referrals`).
2. Perform a DynamoDB `Scan` on the appropriate table, up to 50 results.
3. Return `{ success: true, items: [...] }` as JSON.

**Libraries:** `@aws-sdk/client-dynamodb`, `@aws-sdk/lib-dynamodb`.

---

### 2.5 AWS API Gateway V2 (HTTP API)

A single **HTTP API** (`ChatApi`) serves all backend traffic. It is shared by both orchestrators.

| Route | Integration | Description |
|-------|------------|-------------|
| `POST /api/chat` | `ChatOrchestratorFunction` | Chat with AI assistant |
| `GET /api/records` | `RecordsOrchestratorFunction` | Fetch patients or referrals list |

**CORS:** All origins allowed (`*`) — suitable for development. To be tightened to the CloudFront domain in production.

---

### 2.6 AWS CloudFront Distribution

CloudFront sits in front of everything, serving as both CDN and reverse proxy.

| Behaviour | Path Pattern | Origin | Cache |
|-----------|-------------|--------|-------|
| Default | `/*` | S3 bucket (static HTML/CSS/JS) | Managed caching policy |
| API proxy | `/api/*` | API Gateway V2 endpoint | No cache (TTL=0) |

- **SPA Routing:** 403/404 errors from S3 are rewritten to serve `index.html` with HTTP 200, enabling client-side routing (`/patients`, `/referrals`).
- **HTTPS:** All traffic redirected from HTTP to HTTPS.

---

### 2.7 Amazon DynamoDB

Two tables with **PAY_PER_REQUEST** billing (no capacity planning required):

#### PatientsTable

| Attribute | Type | Role |
|-----------|------|------|
| `PatientID` | String | Partition Key |
| `Name` | String | Patient full name |
| `Age` | Number | Age in years |
| `Condition` | String | Primary medical condition |
| `Status` | String | Active / Follow-up / Critical / Completed |
| `CreatedAt` | String | ISO 8601 timestamp |

#### ReferralsTable

| Attribute | Type | Role |
|-----------|------|------|
| `ReferralID` | String | Partition Key |
| `PatientID` | String | GSI Partition Key (PatientIndex) |
| `PatientName` | String | Denormalised for display |
| `Specialist` | String | e.g., Cardiologist, OB-GYN |
| `Priority` | String | Urgent / High / Medium / Low |
| `Status` | String | Pending / Scheduled / Consulted / Cancelled |
| `CreatedAt` | String | ISO 8601 timestamp |

**Global Secondary Index:** `PatientIndex` on `PatientID` (for querying all referrals for a patient).

**Encryption:** SSE enabled (AWS-managed keys).

---

### 2.8 AWS Cognito

A **User Pool** provides authentication for both ASHA workers accessing the web app and the service-to-service authentication required for the chat orchestrator to reach AgentCore.

| Attribute | Value |
|-----------|-------|
| Auth Flow | `USER_PASSWORD_AUTH`, `USER_SRP_AUTH`, `ALLOW_REFRESH_TOKEN_AUTH` |
| Token type used | `AccessToken` (for AgentCore claim validation) |
| Token cache | In-memory in Lambda, refreshed 5 minutes before expiry |

---

## 3. Data Architecture

### 3.1 Data Flow: Patient Registration via AI

```
ASHA Worker: "Register Anjali, 32 years old, post-partum recovery"
      │
      ▼
Chat UI → POST /api/chat
      │
      ▼
Lambda: chat-orchestrator
  ├─ streamText() with Bedrock (amazon.nova-micro-v1:0)
  ├─ Model detects "register_patient" intent
  └─ Calls MCP tool: register_patient({
       name: "Anjali",
       age: 32,
       condition: "Post-partum Recovery",
       status: "Active"
     })
          │
          ▼
AgentCore MCP Server (FastMCP/Python)
  └─ DynamoDB PutItem → PatientsTable
       PatientID: "PAT#9B3C2DDE"
       ...
```

### 3.2 Data Flow: Records Dashboard

```
PHC Staff opens /patients page
      │
      ▼
Browser: GET /api/records?type=patients
      │
      ▼ (CloudFront → API Gateway)
Lambda: records-orchestrator
  └─ DynamoDB Scan → PatientsTable (Limit: 50)
      │
      ▼
Response: { success: true, items: [{PatientID, Name, Age, ...}, ...] }
      │
      ▼
DataTable component renders with client-side search + sort
```

---

## 4. Infrastructure as Code

All AWS resources are defined as **CloudFormation** templates, generated via a Node.js build script.

**Repository Structure:**
```
infra/
├── build.js                    ← Merges src/*.js into dist/template.json
├── deploy.sh                   ← Full deployment pipeline script
├── sync-logic.js               ← Syncs AI logic from Next.js route → Lambda
├── src/
│   ├── index.js                ← Main template (Parameters, Outputs)
│   ├── dynamodb.js             ← DynamoDB table definitions
│   ├── iam-roles.js            ← IAM Role with Bedrock + DynamoDB policies
│   ├── lambda-functions.js     ← Lambda function definitions
│   ├── api-gateway.js          ← API Gateway V2 routes + integrations
│   └── s3-cloudfront.js        ← S3 bucket + CloudFront distribution
├── chat-orchestrator/
│   └── index.js                ← Lambda function code
└── records-orchestrator/
    └── index.js                ← Lambda function code
```

**Deployment Pipeline (`deploy.sh`):**

```
Step 1: node build.js          → Generate dist/template.json
Step 2: node sync-logic.js     → Sync normalization logic to Lambda
Step 3: npm install + zip      → Package chat-orchestrator/
Step 4: npm install + zip      → Package records-orchestrator/
Step 5: aws cloudformation validate-template
Step 6: aws cloudformation update-stack (or create-stack)
         └─ Lambda code forced via aws lambda update-function-code
Step 7: aws s3 sync out/       → Upload Next.js static export
Step 8: aws cloudfront create-invalidation
```

**IAM Role (`MCPServerRole`)** — shared by both Lambda functions — grants:
- `bedrock:InvokeModel`, `bedrock:InvokeModelWithResponseStream`
- `dynamodb:PutItem`, `GetItem`, `UpdateItem`, `DeleteItem`, `Query`, `Scan`, `DescribeTable` on both tables and their GSIs
- `logs:CreateLogGroup`, `logs:CreateLogStream`, `logs:PutLogEvents` (via AWSLambdaBasicExecutionRole)

---

## 5. Security Design

| Concern | Mechanism |
|---------|-----------|
| Data in transit | HTTPS/TLS 1.2+ enforced by CloudFront and API Gateway |
| Data at rest | DynamoDB SSE (AWS-managed), S3 SSE-S3 |
| API authentication | Cognito AccessToken (Bearer) validated by AgentCore |
| Service-to-service auth | Lambda uses cached Cognito AccessToken for MCP calls |
| Secrets management | Environment variables in Lambda (to be migrated to AWS Secrets Manager) |
| DynamoDB access control | IAM policy — Lambda role has least-privilege table ARN access |
| Frontend security | CloudFront OAC (Origin Access Control) — S3 bucket is fully private |

---

## 6. Future Architecture Extensions

### 6.1 Voice Input Pipeline (Audio Registration)
```
ASHA Worker (mobile browser/app)
    │ Audio blob (MP3, 16kHz)
    ▼
S3 Upload (asha-audio-input/{asha_id}/{timestamp}.mp3)
    │ S3 Event
    ▼
Lambda: transcribe-handler
    │ AWS Transcribe (Hindi/English/multi-lang auto-detect)
    ▼
Lambda: extract-fields (Bedrock Claude)
    │ Structured JSON {name, age, condition, ...}
    ▼
MCP Tool: register_patient(...)
    ▼
DynamoDB: PatientsTable
```

### 6.2 AI Risk Scoring Engine
- **SageMaker Endpoints** host pre-trained classification models.
- On referral creation, Lambda asynchronously invokes the SageMaker endpoint.
- Risk score (0.0–1.0) and contributing factors stored back in `ReferralsTable`.
- PHC dashboard sorts referrals by risk score (highest first).

### 6.3 Analytics & Supervisor Dashboard
- **Amazon QuickSight** or a custom React dashboard consuming aggregated DynamoDB data via Lambda.
- EventBridge scheduled rules refresh nightly summaries.

### 6.4 Offline Mode
- **AWS AppSync** with local conflict resolution for mobile ASHA workers.
- Or: SQLite local cache in a React Native mobile app synced via a Lambda batch sync endpoint.

### 6.5 Notification Pipeline
```
EventBridge rule: ReferralCreated / StatusUpdated
    ▼
Lambda: send-notification
  ├── AWS SNS → SMS to patient mobile
  ├── AWS SNS → Push notification to ASHA app
  └── AWS SES → Email to supervisor (escalations)
```

### 6.6 Multi-Region & Disaster Recovery
- DynamoDB Global Tables for multi-region active-active replication.
- CloudFront with multiple API Gateway regions as failover origins.
