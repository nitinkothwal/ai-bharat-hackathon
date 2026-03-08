# 🏥 BharatCare Link
## AI-Powered Smart Referral & Healthcare Coordination Platform
### AWS AI for Bharat Hackathon

> **Bridging the last-mile healthcare gap between ASHA workers in rural India and Primary Health Centres (PHCs) — using conversational AI, MCP tooling, and a 100% serverless AWS architecture.**

---

## Table of Contents
1. [Problem Statement](#1-problem-statement)
2. [Solution Overview](#2-solution-overview)
3. [Key Features](#3-key-features)
4. [System Architecture](#4-system-architecture)
5. [AWS Services Used](#5-aws-services-used)
6. [Project Structure](#6-project-structure)
7. [Getting Started (Local Development)](#7-getting-started-local-development)
8. [Deployment to AWS](#8-deployment-to-aws)
9. [Data Model](#9-data-model)
10. [Security & Compliance](#10-security--compliance)
11. [Success Metrics](#11-success-metrics)
12. [Product Roadmap](#12-product-roadmap)
13. [Social Impact](#13-social-impact)
14. [Documentation](#14-documentation)

---

## 1. Problem Statement

In rural India, **ASHA (Accredited Social Health Activist) workers** are the first point of contact for millions of patients — identifying high-risk individuals including:

- Pregnant women with complications
- Malnourished children
- Tuberculosis suspects
- Patients with chronic illnesses

Today, referrals from ASHA workers to PHCs are:
- 📄 **Paper-based or informal** — WhatsApp messages, handwritten slips
- 🚫 **Unstructured** — no consistent data format across districts
- 🔍 **Not tracked** — no visibility on whether a patient actually visited the PHC
- ⚠️ **Not risk-prioritised** — PHC doctors have no way to triage by urgency
- 🔄 **Duplicated** — same patient data re-entered at ASHA and PHC levels

**This results in:** delayed care for the most vulnerable, overloaded PHCs, missed follow-ups, poor referral closure rates, and zero district-level visibility.

---

## 2. Solution Overview

**BharatCare Link** is a cloud-native, AI-driven referral coordination platform that:

- 🤖 **Provides an AI chat assistant** that ASHA workers use to register patients and create referrals through natural language — no forms to fill out manually.
- 🔗 **Uses Model Context Protocol (MCP)** deployed on **AWS Bedrock AgentCore Runtime** to give the AI secure, tool-based access to patient data.
- 📋 **Gives PHC staff a records dashboard** to view all registered patients and referrals with filtering, searching, and sorting.
- ☁️ **Runs 100% serverless on AWS** — zero idle cost, auto-scales to demand.

The AI assistant understands ASHA worker intent ("Register Anjali, 32 years, post-partum recovery") and executes the right backend operation — no training required.

---

## 3. Key Features

### ✅ Implemented (Current Version)

| Feature | Description |
|---------|-------------|
| 🤖 **AI Conversational Assistant** | Natural language chat powered by Amazon Bedrock (`amazon.nova-micro-v1:0`), streamed in real time |
| 🔗 **MCP Tool Integration** | `register_patient` and `create_referral` tools executed via AgentCore MCP Runtime |
| 📋 **Registered Patients View** | Live table of all registered patients with client-side search, sort, and status badges |
| 📎 **All Referrals View** | Live table of all referrals with priority color-coding, status tracking, and refresh |
| 🧭 **Collapsible Sidebar Navigation** | Persistent sidebar linking Actions and Records sections |
| 🔐 **Secure Auth** | Cognito User Pool auth with AccessToken caching for MCP calls |
| 🏗️ **CloudFormation IaC** | Complete infrastructure defined as code with automated deployment pipeline |

### 🔮 Planned (Future Scope)

| Feature | Description |
|---------|-------------|
| 🎙️ **Voice-Based Registration** | ASHA worker speaks patient details → AWS Transcribe → Bedrock extracts structured fields |
| 🧠 **AI Risk Scoring** | SageMaker XGBoost/Random Forest model assigns risk score (0.0–1.0) to each referral |
| 📊 **PHC Analytics Dashboard** | Referral trends, closure rates, village heatmaps |
| 📱 **Offline-First Mobile** | Local SQLite cache on mobile with background sync on reconnect |
| 🔔 **Follow-Up Alerts** | Day 7/14/21 escalation chain via SNS (SMS) and SES (Email) |
| 🗺️ **Village Heatmap** | Geographic risk density map by village |

---

## 4. System Architecture

```
┌──────────────────────────────────────────────────────────┐
│   ASHA Web App  (Next.js SPA · ASHA Workers + PHC Staff) │
│   Chat UI  │  Patients Table  │  Referrals Table          │
└──────────────────────────┬───────────────────────────────┘
                           │ HTTPS
                           ▼
                  ┌─────────────────┐
                  │  CloudFront CDN │  (SPA routing + API proxy)
                  └────────┬────────┘
                 /          \
         Static (S3)      API (/api/*)
                            │
                   ┌────────▼────────┐
                   │  API Gateway V2 │
                   └──┬──────────┬───┘
                      │          │
          POST /api/chat    GET /api/records
                      │          │
           ┌──────────▼──┐  ┌────▼──────────────┐
           │   Lambda     │  │   Lambda           │
           │  chat-       │  │  records-          │
           │  orchestrator│  │  orchestrator      │
           └──────────────┘  └────────────────────┘
                  │                    │
         Vercel AI SDK            DynamoDB Scan
         streamText()             PatientsTable
                  │               ReferralsTable
         Amazon Bedrock
         (nova-micro-v1:0)
                  │
         MCP HTTP Client
          Bearer {Cognito AccessToken}
                  │
   ┌──────────────▼───────────────────────────┐
   │  AWS Bedrock AgentCore Runtime            │
   │  MCP Server (FastMCP / Python)            │
   │  Tools: register_patient, create_referral │
   └──────────────────────────────────────────┘
                  │
             DynamoDB PutItem
          PatientsTable / ReferralsTable
```

---

## 5. AWS Services Used

| Service | Purpose |
|---------|---------|
| **Amazon Bedrock** (`amazon.nova-micro-v1:0`) | Powers the AI assistant — intent understanding, tool calling, and response generation |
| **AWS Bedrock AgentCore Runtime** | Managed hosting for the MCP server (FastMCP/Python). Provides auto-scaling HTTPS endpoint with Cognito auth. |
| **AWS Lambda** | Serverless compute for Chat Orchestrator and Records Orchestrator |
| **Amazon API Gateway V2** | HTTP API routing `/api/chat` and `/api/records` to respective Lambdas |
| **Amazon DynamoDB** | NoSQL storage for `PatientsTable` and `ReferralsTable` (On-Demand, SSE enabled) |
| **AWS Cognito** | User authentication and service-to-service token generation for AgentCore |
| **Amazon S3** | Hosts the Next.js static export (web app) |
| **Amazon CloudFront** | CDN with SPA routing + reverse proxy to API Gateway |
| **AWS CloudFormation** | Infrastructure as Code for all AWS resources |
| *(Planned)* **Amazon Transcribe** | Multi-lingual voice-to-text for audio patient registration |
| *(Planned)* **Amazon SageMaker** | Hosts XGBoost/Random Forest risk scoring ML models |
| *(Planned)* **Amazon EventBridge** | Event-driven follow-up and escalation triggers |
| *(Planned)* **Amazon SNS / SES** | SMS and email notification delivery |

---

## 6. Project Structure

```
bharat-care-link/
├── apps/
│   └── asha-web/                  # Next.js frontend (ASHA + PHC web app)
│       ├── app/
│       │   ├── layout.tsx          # Root layout with Sidebar
│       │   ├── page.tsx            # AI Chat page
│       │   ├── patients/page.tsx   # Registered Patients table
│       │   ├── referrals/page.tsx  # All Referrals table
│       │   └── api/
│       │       ├── chat/route.ts   # Chat API route (local dev only)
│       │       └── records/route.ts# Records API route (local dev only)
│       └── components/
│           ├── Sidebar.tsx         # Collapsible sidebar navigation
│           ├── DataTable.tsx       # Reusable data table with search/sort
│           ├── MyAssistant.tsx     # AI chat interface wrapper
│           └── ToolCards.tsx       # Tool feature cards
│
├── packages/
│   └── healthcare-core-mcp/       # MCP Server (FastMCP / Python)
│       └── main.py                 # register_patient, create_referral tools
│                                   # Deployed to AWS Bedrock AgentCore Runtime
│
├── infra/
│   ├── build.js                   # Generates CloudFormation template
│   ├── deploy.sh                  # Full deployment pipeline
│   ├── sync-logic.js              # Syncs AI logic to Lambda
│   ├── src/
│   │   ├── index.js               # CloudFormation: Parameters + Outputs
│   │   ├── dynamodb.js            # DynamoDB table definitions
│   │   ├── iam-roles.js           # IAM Role + Policies
│   │   ├── lambda-functions.js    # Lambda function definitions
│   │   ├── api-gateway.js         # API Gateway V2 routes
│   │   └── s3-cloudfront.js       # S3 + CloudFront distribution
│   ├── chat-orchestrator/
│   │   └── index.js              # Chat Lambda function code
│   └── records-orchestrator/
│       └── index.js              # Records Lambda function code
│
├── requirements.md                # Functional & non-functional requirements
├── design.md                      # System design & architecture specification
└── README.md                      # This file
```

---

## 7. Getting Started (Local Development)

### Prerequisites
- Node.js 18+
- AWS CLI configured with appropriate credentials
- An `.env.local` file in `apps/asha-web/` (see below)

### Environment Variables (`apps/asha-web/.env.local`)
```env
AWS_REGION=us-east-1
COGNITO_CLIENT_ID=<your-cognito-app-client-id>
COGNITO_USER_POOL_ID=<your-user-pool-id>
COGNITO_USERNAME=<service-account-email>
COGNITO_PASSWORD=<service-account-password>
MCP_SERVER_URL=<agentcore-runtime-invocation-url>
```

### Run Frontend Locally

```bash
cd apps/asha-web
npm install
npm run dev
# → http://localhost:3000
```

> **Local API routes** (`/api/chat`, `/api/records`) are active when running `npm run dev`. These are disabled in the static export build and replaced by Lambda functions in production.

### Run MCP Server Locally (optional)

```bash
cd packages/healthcare-core-mcp
uv run main.py sse
# → http://localhost:8000/sse
# Then set MCP_SERVER_URL=http://localhost:8000/sse in .env.local
```

---

## 8. Deployment to AWS

The project uses a single shell script to deploy everything:

```bash
cd infra
npm run deploy
# or: bash deploy.sh
```

**What `deploy.sh` does:**
1. Builds the CloudFormation template (`dist/template.json`).
2. Syncs AI normalization logic from Next.js route → Lambda.
3. Packages `chat-orchestrator` and `records-orchestrator` Lambda functions.
4. Validates CloudFormation template with AWS.
5. Creates or updates the CloudFormation stack.
6. Forces Lambda code update via `aws lambda update-function-code`.
7. Builds the Next.js static export (hiding API routes from the build).
8. Syncs the static output to S3.
9. Invalidates the CloudFront cache.

**Skip web app deployment** (infra-only):
```bash
bash deploy.sh --skip-webapp
```

**Deployed URL:** `https://d1r3c2192oaa04.cloudfront.net`

---

## 9. Data Model

### PatientsTable (DynamoDB)
| Field | Type | Notes |
|-------|------|-------|
| `PatientID` | String (PK) | Format: `PAT#XXXXXXXX` |
| `Name` | String | Full name |
| `Age` | Number | Years |
| `Condition` | String | Primary medical condition |
| `Status` | String | Active / Follow-up / Completed / Critical |
| `CreatedAt` | String | ISO 8601 |

### ReferralsTable (DynamoDB)
| Field | Type | Notes |
|-------|------|-------|
| `ReferralID` | String (PK) | Format: `REF#XXXXXXXX` |
| `PatientID` | String (GSI) | Links to PatientsTable |
| `PatientName` | String | Denormalised for display |
| `Specialist` | String | e.g., Cardiologist, OB-GYN |
| `Priority` | String | Urgent / High / Medium / Low |
| `Status` | String | Pending / Scheduled / Consulted / Cancelled |
| `CreatedAt` | String | ISO 8601 |

---

## 10. Security & Compliance

- 🔒 **HTTPS only** — CloudFront enforces TLS on all traffic.
- 🔑 **Cognito authentication** — All service-to-service calls use short-lived Cognito AccessTokens.
- 🗄️ **Encryption at rest** — DynamoDB SSE enabled; S3 SSE-S3 enabled.
- 🛡️ **Least-privilege IAM** — Lambda roles scoped to specific table ARNs only.
- 🌐 **Private S3 bucket** — CloudFront OAC (Origin Access Control) ensures the S3 bucket is not publicly accessible.
- 📋 **HIPAA awareness** — Designed with encryption at rest and in transit; field-level encryption for PII planned in future scope.

---

## 11. Success Metrics

| Metric | Target |
|--------|--------|
| Referral delay reduction | ≥ 30% |
| PHC triage time improvement | ≥ 40% |
| High-risk ML classification precision *(planned)* | ≥ 80% |
| Referral lifecycle visibility | 100% |
| Duplicate patient entries | Measurable reduction |
| Chat response latency (first token) | < 3s (p95) |
| Records API latency | < 2s (p95) |

---

## 12. Product Roadmap

### ✅ Phase 0: Foundation (Completed — March 2026)
- AI chat assistant with patient registration and referral creation.
- MCP server deployed on AWS Bedrock AgentCore Runtime.
- Records dashboard for ASHA workers and PHC staff.
- Full CloudFormation IaC with automated deployment pipeline.

### 🚧 Phase 1: Voice & Risk Intelligence (0–6 Months)
- Voice-based patient registration via AWS Transcribe + Bedrock.
- AI Risk Scoring via SageMaker (pregnancy, malnutrition, TB).
- Risk score displayed in referrals dashboard.
- PHC staff status update workflow.
- Pilot across 50 PHCs in a single district.

### 📅 Phase 2: District-Scale (6–18 Months)
- Integration with state-level health registries.
- Offline-first mobile experience with background sync.
- Follow-up alert system (Day 7/14/21 escalation chain).
- Village heatmap and supervisor analytics dashboard.
- Multi-language support (Hindi, Marathi, Tamil, Telugu, Kannada, Bengali).
- Formal training for 500+ ASHA workers.

### 🌏 Phase 3: National Integration (18+ Months)
- ABHA (Ayushman Bharat Health Account) integration.
- Federated learning for model improvement without PII transfer.
- Real-time national maternal and child health monitoring dashboard.
- Automated inventory planning based on referral trends.

---

## 13. Social Impact

BharatCare Link addresses the **"Referral Leakage"** problem in India's Rs. 5 Lakh Crore public health system:

- 💰 **Cost Savings:** Correct triage reduces unnecessary transport and admin overhead by an estimated 20%.
- 👶 **Improved Outcomes:** Early detection of high-risk cases reduces maternal mortality (MMR) and infant mortality (IMR).
- 👩‍⚕️ **ASHA Empowerment:** Voice-to-form tools dramatically reduce cognitive and literacy barriers for ASHA workers.
- 📈 **Data-Driven Health:** District-level dashboards enable evidence-based resource allocation.

---

## 14. Documentation

| Document | Description |
|----------|-------------|
| [requirements.md](requirements.md) | Full functional requirements, actor definitions, data schemas, and future scope |
| [design.md](design.md) | System design, architecture diagrams, component specifications, and security design |
