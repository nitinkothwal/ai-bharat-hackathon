# Bharat CareLink – Requirements Specification

**Version:** 1.1  
**Status:** Active Development  
**Last Updated:** March 2026  

---

## Table of Contents
1. [Project Vision](#1-project-vision)
2. [Actors & Roles](#2-actors--roles)
3. [Functional Requirements](#3-functional-requirements)
4. [Non-Functional Requirements](#4-non-functional-requirements)
5. [Data Requirements](#5-data-requirements)
6. [Future Scope](#6-future-scope)

---

## 1. Project Vision

Bharat CareLink is an AI-powered last-mile healthcare coordination platform designed to bridge the gap between **ASHA (Accredited Social Health Activist) workers** in rural India and **Primary Health Centres (PHCs)**. 

ASHA workers serve as the first point of contact for millions of patients in remote villages. They need a simple, intelligent tool to register patients, identify high-risk individuals, and create specialist referrals — all in an environment with limited literacy, intermittent connectivity, and multi-lingual users.

BharatCare Link solves this by providing:
- A conversational AI assistant that understands registration and referral intent.
- Structured data capture integrated with a cloud backend.
- A record-keeping interface for ASHA workers and PHC staff to track all cases.

---

## 2. Actors & Roles

| Actor | Description | Primary Interface |
|-------|-------------|-------------------|
| **ASHA Worker** | Community health worker who visits patients in villages. Registers patients and creates referrals on behalf of patients. | Asha Web App (chat-first interface on a smartphone) |
| **PHC Staff / Doctor** | Primary Health Centre staff who receive and process referrals. Completes clinical evaluation and updates referral outcomes. | Asha Web App (Records Dashboard view) |
| **Supervisor / Block Medical Officer** | Monitors coverage, quality, and escalated cases. Views aggregate reporting. | Records Dashboard (future: dedicated Supervisor view) |

---

## 3. Functional Requirements

### 3.1 AI Assistant (Chat Interface) — Implemented

#### 3.1.1 Conversational AI for ASHA Workers
- The assistant must understand natural language requests from ASHA workers.
- Supported intents:
  - **Patient Registration:** Extract patient demographics (name, age, condition) and persist to DynamoDB.
  - **Specialist Referral:** Create a referral linking a patient to a specialist (Cardiologist, OB-GYN, etc.) and assign a priority.
- The assistant must handle **multi-step tool calls** (e.g., "Register this patient and then refer her to a Cardiologist").
- Responses must be **streamed in real-time** for a responsive feel on slow connections.
- The assistant must be friendly, concise, and professional — suitable for a semi-literate user aided by a health supervisor.

#### 3.1.2 Tool Execution via MCP
- The backend must expose tools via the **Model Context Protocol (MCP)** over HTTPS.
- Currently supported MCP tools:
  - `register_patient`: Creates a new patient record in DynamoDB.
  - `create_referral`: Creates a new referral record linked to a patient.
- Tools must execute and return confirmations within **5 seconds (p95)**.
- Tool definitions must be discoverable by the AI model via the MCP tool listing endpoint.

#### 3.1.3 Authentication
- All API calls must be authenticated via **AWS Cognito** (User Pool, USER_PASSWORD_AUTH flow).
- The system must cache Cognito tokens and refresh them before expiry to avoid re-authentication latency.

---

### 3.2 Records Dashboard — Implemented

#### 3.2.1 Registered Patients View
- Display a paginated/scrollable list (up to 50 records) of all patients registered through the BharatCare network.
- Columns: Patient ID, Full Name, Age, Primary Condition, Status, Registered On.
- **Client-side searching:** Filter across all visible columns in real time.
- **Client-side sorting:** Sort by any column (ascending/descending) by clicking the column header.
- Status badges must be color-coded:
  - `Active` — Blue
  - `Follow-up` — Amber
  - `Completed` — Green
  - `Critical` — Red
- A **Refresh** button must trigger a data re-fetch from the API.

#### 3.2.2 All Referrals View
- Display a paginated/scrollable list (up to 50 records) of all referrals generated through BharatCare.
- Columns: Referral ID, Patient Name, Specialist, Priority, Status, Created On.
- Client-side searching and sorting (same as Patients view).
- Priority must be color-coded: `Urgent` > `High` > `Medium` > `Low`.
- Status badges: `Pending`, `Scheduled`, `Consulted`, `Cancelled`.
- A **Refresh** button must trigger a data re-fetch from the API.

---

### 3.3 Navigation & Layout — Implemented

- The application must have a **persistent sidebar** providing navigation to all major sections.
- Sidebar sections:
  - **Actions:** AI Assistant, New Registration (links to chat with prompt), Referral (links to chat with prompt).
  - **Records:** Registered Patients (`/patients`), All Referrals (`/referrals`).
- The sidebar must be **collapsible** to maximise screen space on smaller devices.
- The application must be a **Single Page Application (SPA)** hosted on S3/CloudFront.
- Navigation between pages must not require full page reloads.

---

### 3.4 Backend API — Implemented

#### 3.4.1 Chat Orchestration API
- **Endpoint:** `POST /api/chat`
- Accepts a list of chat messages, streams the AI response back to the client.
- Authenticates with the MCP server using a Cognito `AccessToken`.
- Routes through AWS API Gateway → Lambda (`chat-orchestrator`) → AWS Bedrock + AgentCore MCP.

#### 3.4.2 Records Fetch API
- **Endpoint:** `GET /api/records?type=patients` or `?type=referrals`
- Returns up to 50 records from the corresponding DynamoDB table via a full scan.
- Routes through AWS API Gateway → Lambda (`records-orchestrator`) → DynamoDB.
- Must return JSON: `{ success: true, items: [...] }`.

#### 3.4.3 MCP Server (AWS Bedrock AgentCore Runtime)
- The MCP (Model Context Protocol) server is deployed as a managed runtime on **AWS Bedrock AgentCore Runtime**, not as a traditional Lambda or container.
- AgentCore provides a managed, auto-scaling HTTPS endpoint for the MCP server.
- The Chat Orchestrator Lambda connects to this endpoint using an authenticated HTTP MCP transport (`Bearer {Cognito AccessToken}`).
- AgentCore validates the Cognito `AccessToken` (specifically the `client_id` claim) before routing to the MCP tool handler.
- The MCP server exposes the following tools to the AI model: `register_patient`, `create_referral`, `list_patients`.
- All MCP tool executions result in DynamoDB operations (PutItem, Scan).

---

## 4. Non-Functional Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-01 | **Latency** — Chat responses must begin streaming within 3 seconds. | p95 < 3s (first token) |
| NFR-02 | **Latency** — Records API must return within 2 seconds for ≤ 50 rows. | p95 < 2s |
| NFR-03 | **Scalability** — The backend must scale to zero on idle and handle traffic spikes using serverless architecture. | AWS Lambda (auto-scaling) |
| NFR-04 | **Security** — All data in transit must be encrypted via HTTPS/TLS 1.2+. | Enforced via CloudFront + API Gateway |
| NFR-05 | **Security** — All data at rest must be encrypted (DynamoDB SSE, S3 SSE). | DynamoDB SSE enabled by default |
| NFR-06 | **Availability** — The web application SLA must be ≥ 99.9%. | AWS CloudFront (99.99% SLA) |
| NFR-07 | **Cost** — Near-zero idle cost. No persistent servers. | 100% Serverless |
| NFR-08 | **Compliance** — Sensitive patient data must be handled with HIPAA awareness (encryption at rest and in transit). | AWS KMS (future: field-level encryption) |
| NFR-09 | **Browser Support** — The web app must work on Chrome, Firefox, and mobile Chrome (Android). | Modern browser support via Next.js |

---

## 5. Data Requirements

### 5.1 Patients Table (DynamoDB)

**Table:** `ai-bharat-care-link-patients-dev`

| Field | Type | Notes |
|-------|------|-------|
| `PatientID` | String (PK) | Format: `PAT#XXXXXXXX` |
| `Name` | String | Full name of patient |
| `Age` | Number | Patient age in years |
| `Condition` | String | Primary medical condition |
| `Status` | String | `Active`, `Follow-up`, `Completed`, `Critical` |
| `CreatedAt` | String | ISO 8601 timestamp |
| `AshaID` | String | ID of the ASHA worker who registered |

### 5.2 Referrals Table (DynamoDB)

**Table:** `ai-bharat-care-link-referrals-dev`

| Field | Type | Notes |
|-------|------|-------|
| `ReferralID` | String (PK) | Format: `REF#XXXXXXXX` |
| `PatientID` | String (GSI PK) | Links to Patients table |
| `PatientName` | String | Denormalised for display |
| `Specialist` | String | e.g., Cardiologist, OB-GYN |
| `Priority` | String | `Urgent`, `High`, `Medium`, `Low` |
| `Status` | String | `Pending`, `Scheduled`, `Consulted`, `Cancelled` |
| `CreatedAt` | String | ISO 8601 timestamp |

---

## 6. Future Scope

The following features are planned for upcoming iterations. They maintain the same ASHA Worker + PHC actor model.

### 6.1 Voice-Based Patient Registration (High Priority)
- ASHA workers often operate in low-literacy environments. **Audio-based data capture** is the next major feature.
- The ASHA worker speaks the patient's information (name, age, condition, village) in their local language (Hindi, Marathi, Tamil, Telugu, Kannada, Bengali).
- **AWS Transcribe** converts the audio to text, pre-filling the registration form.
- **Amazon Bedrock** extracts structured fields from the transcribed text.
- Audio files (MP3, 16kHz, mono) are stored in S3 for audit purposes.
- Transcription confidence score threshold: auto-fill if >0.85, else prompt ASHA worker to review.
- Maximum recording duration: 60 seconds per field.

### 6.2 AI Risk Scoring for Referrals
- When a referral is created, automatically compute a **Risk Score (0.0–1.0)** using a trained ML model (XGBoost/Random Forest on SageMaker).
- Risk scoring categories: High-Risk Pregnancy, Child Malnutrition, TB Suspect, Chronic Disease.
- Expose the risk score in the Referrals dashboard with color-coded severity badges.
- PHC staff view referrals sorted by risk score (highest risk first).

### 6.3 PHC Staff Dashboard Enhancements
- A dedicated **Status Update Panel** for PHC staff to update referral outcomes (Diagnosis, Treatment, Follow-up dates).
- An **AI Case Summary** generated by Amazon Bedrock Claude for each referral on the detail page.
- Analytics widgets: Referrals by type, referrals by status over time, top villages by volume.

### 6.4 Offline Support for ASHA Workers
- Local SQLite cache on the mobile device stores pending registrations and referrals.
- Automatic sync when connectivity is restored (WiFi or cellular).
- Sync priority: High-risk cases first.
- Conflict resolution: Server timestamp wins.

### 6.5 Follow-Up & Escalation Alerts
- Day 7: SMS reminder to ASHA worker for pending referrals.
- Day 14: SMS + email to supervisor.
- Day 21: Escalation to Block Medical Officer.
- Delivered via AWS SNS (SMS) and AWS SES (Email).

### 6.6 Village Heatmap
- Geographic view of referral density and risk level by village.
- Powered by AWS Location Service or OpenStreetMap with Leaflet.

### 6.7 Multilingual Support
- ASHA Web App interface available in Hindi and English by default.
- AI assistant responses can be translated to the user's preferred language via AWS Translate.
