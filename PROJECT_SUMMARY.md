# BharatCare Link — Project Summary
## AWS AI for Bharat Hackathon

> *"Every high-risk mother in rural India deserves the same urgency that a critical patient in a city ICU receives. BharatCare Link makes that possible."*

---

## The Problem We Are Solving

India has over **1 million ASHA (Accredited Social Health Activist) workers** — the backbone of rural public health. They walk kilometres every day to visit pregnant women, malnourished children, and TB suspects in remote villages. They are often the only trained healthcare touchpoint a rural family ever meets.

And yet, when an ASHA worker identifies a high-risk patient who needs a Primary Health Centre (PHC), the process that follows is painfully primitive:

- She **writes a referral slip by hand** — if she has paper.
- She **sends a WhatsApp message** to the PHC — if she has network.
- The PHC doctor receives **dozens of slips with no way to prioritise** who is most critical.
- There is **no tracking** — she has no way to know if the patient actually visited.
- If the patient does not show up, **no one is alerted**.
- The same patient data is re-entered multiple times — at village level, PHC level, and district level.

The result is brutal: **High-risk patients are invisible. Follow-ups are missed. Lives are lost.**

---

## Our Solution: BharatCare Link

BharatCare Link is an **AI-powered healthcare coordination platform** that transforms how ASHA workers register patients and create referrals — and how PHC staff track and manage them.

At its core, it is built on a simple insight:

> **An ASHA worker should not need to fill forms. She should just talk.**

---

## How It Works

### 1. The ASHA Worker Opens the App

An ASHA worker opens the **BharatCare Link web app** on her smartphone. She sees a clean, dark-themed chat interface — similar to WhatsApp, something she already knows.

### 2. She Describes the Patient in Natural Language

She types (or will soon speak) in plain language:

> *"Register Priya Devi, 28 years old, 7th month pregnancy, high blood pressure"*

The AI assistant — powered by **Amazon Bedrock** — understands her intent. It doesn't ask her to fill a form. It extracts the structured data (name, age, condition, status) and calls the `register_patient` tool.

### 3. The Patient Is Registered Instantly

Within seconds, the patient record is saved to **Amazon DynamoDB** via the **MCP (Model Context Protocol) server** running on **AWS Bedrock AgentCore Runtime**. The ASHA worker sees a confirmation:

> *"✅ Priya Devi has been registered. Patient ID: PAT#7F3A2B1C"*

### 4. She Creates a Referral in the Same Conversation

She continues:

> *"Refer her to the OB-GYN specialist. Priority: High."*

The AI calls `create_referral`. A referral record is created and linked to the patient.

### 5. The PHC Staff Sees It Immediately

On the **PHC dashboard**, a staff member opens the **Referrals** view. They see all incoming referrals — sorted, searchable, and colour-coded by priority. Priya Devi's referral appears with a **HIGH** priority badge.

---

## Why This Matters: Impact on ASHA Workers

### Before BharatCare Link
| Pain Point | Reality |
|-----------|---------|
| Data entry | Handwritten slips or WhatsApp texts |
| Confirmation | None — she never knows if it was received |
| Follow-up | Manual calls or visits |
| Training required | Complex software with multiple screens and forms |
| Literacy barriers | Forms in English or formal Hindi |

### After BharatCare Link
| Improvement | Impact |
|-------------|--------|
| **Conversational data capture** | No forms — she speaks naturally |
| **Instant confirmation** | AI replies with patient ID and referral ID |
| **Centralised tracking** | Every patient visible in one dashboard |
| **Zero re-entry** | Data entered once, available everywhere |
| **Future: Voice input** | She speaks in Hindi, Tamil, Marathi — AI registers the patient |

An ASHA worker who previously spent 20 minutes on paperwork per referral can now complete the same task in **under 2 minutes** — with higher data quality and no risk of loss.

---

## Why This Matters: Impact on Patient Tracking

Today, a referred patient is essentially a mystery once they leave the village. BharatCare Link changes this fundamentally:

### Complete Referral Lifecycle Visibility

```
Patient Identified by ASHA
       ↓
Registered in BharatCare Link (PatientID: PAT#XXXX)
       ↓
Referral Created (ReferralID: REF#YYYY, Priority: HIGH)
       ↓
PHC Staff Views Referral in Dashboard
       ↓
[Future] PHC Updates Status → ASHA Notified via SMS
       ↓
[Future] If no update in 7 days → Automated reminder triggered
       ↓
[Future] Day 14 → Supervisor alerted
       ↓
[Future] Day 21 → Block Medical Officer escalation
```

No one falls through the cracks. Every high-risk patient has a digital thread that follows them through the system.

---

## The AI Innovation: MCP on AWS Bedrock AgentCore

What makes BharatCare Link technically distinct is its use of the **Model Context Protocol (MCP)** — the emerging standard for giving AI models secure, structured access to backend systems.

### Traditional AI Chatbot
```
User → AI Model → Text response (no real action)
```

### BharatCare Link with MCP
```
ASHA Worker → AI Model (Bedrock) → MCP Tool Call → DynamoDB (real data)
                                    ↑
                              AgentCore Runtime
                              (managed, auto-scaling,
                               Cognito-authenticated)
```

The AI doesn't just talk — it **acts**. When it registers a patient, the data is in DynamoDB. When it creates a referral, the PHC sees it immediately.

The MCP server is hosted on **AWS Bedrock AgentCore Runtime** — a managed service that:
- Auto-scales with demand.
- Validates every call via **Cognito AccessToken** authentication.
- Requires zero server management.

---

## AWS Services — Why Each One Was Chosen

| Service | Why It Was Chosen |
|---------|------------------|
| **Amazon Bedrock** (`nova-micro-v1:0`) | Cost-effective, fast inference. Critical for scaling to thousands of ASHA workers affordably. |
| **Bedrock AgentCore Runtime** | First-of-its-kind managed MCP server hosting. Eliminates operational overhead. Secure by design. |
| **AWS Lambda** | Zero idle cost. Handles thousands of concurrent ASHA sessions without pre-provisioning. |
| **API Gateway V2** | Millisecond routing with built-in CORS and throttling. |
| **DynamoDB (On-Demand)** | Handles traffic spikes (morning health camp surges) without capacity planning. |
| **Cognito** | Provides healthcare-grade authentication without building auth infrastructure. |
| **S3 + CloudFront** | Delivers the web app to rural users with low latency, even on slow 4G connections. |
| *(Planned)* **AWS Transcribe** | Multi-lingual voice recognition — the key to reaching low-literacy ASHA workers. |
| *(Planned)* **SageMaker** | Hosts risk scoring ML models that automatically triage referrals by medical severity. |

---

## The Numbers Behind the Impact

India's rural health system in numbers:

| Metric | Value |
|--------|-------|
| ASHA workers in India | 1.05 million |
| Villages covered per ASHA | 1,000–2,000 population |
| PHCs in India | ~30,000 |
| Annual referrals estimated | Tens of millions |
| Referral completion rate (current) | Estimated < 60% |
| Maternal deaths in India annually | ~44,000 (many preventable) |

BharatCare Link targets a **30% reduction in referral delay** and a **40% improvement in PHC triage time** in Phase 1. At scale, even a 10% improvement in referral completion rates translates to **thousands of lives saved annually**.

---

## Real-World Scenario: Priya Devi's Journey

**Without BharatCare Link:**
1. ASHA worker Sunita writes Priya's details on a slip of paper.
2. She hands it to a driver heading to the PHC.
3. The slip reaches the PHC. It goes into a pile of 40 others.
4. The PHC doctor has no way to know Priya has dangerously high blood pressure.
5. Priya is seen on Day 3 — in the same queue as a routine checkup.
6. No one follows up. Priya doesn't return for her Week 8 visit.
7. Sunita finds out only when she visits the village again — 3 weeks later.

**With BharatCare Link:**
1. Sunita opens the app and types: *"Register Priya Devi, 28y, 7th month pregnancy, BP high."*
2. Patient registered. Referral created. Priority: HIGH.
3. PHC dashboard shows Priya at the **top of the queue**.
4. PHC doctor sees her within hours and starts antihypertensive treatment.
5. *(Future)* Day 7: Sunita gets an SMS — "Priya's referral status: Completed."
6. *(Future)* Day 14: Follow-up reminder sent if no visit is recorded.

**The difference is not a better form. It is a system that cares.**

---

## What We Built in This Hackathon

| Deliverable | Status |
|------------|--------|
| AI chat assistant (Amazon Bedrock + MCP) | ✅ Complete |
| MCP server on Bedrock AgentCore Runtime | ✅ Complete |
| Patient registration tool (`register_patient`) | ✅ Complete |
| Referral creation tool (`create_referral`) | ✅ Complete |
| Registered Patients dashboard (live data) | ✅ Complete |
| All Referrals dashboard (live data) | ✅ Complete |
| Client-side search, sort, and filter | ✅ Complete |
| Collapsible navigation sidebar | ✅ Complete |
| Full CloudFormation IaC deployment | ✅ Complete |
| Automated deployment pipeline (`deploy.sh`) | ✅ Complete |
| Live production URL (CloudFront) | ✅ https://d1r3c2192oaa04.cloudfront.net |

---

## What Comes Next

The foundation is built. The next phase brings the features that will have the deepest impact on the most vulnerable:

1. **Voice Registration** — An ASHA worker in rural Bihar should register patients in Bhojpuri using her voice. AWS Transcribe + Bedrock will make that real.
2. **AI Risk Scoring** — A SageMaker model will automatically compute a risk score for every referral, ensuring the sickest patient is always seen first.
3. **Follow-Up Alerts** — An EventBridge + SNS pipeline will send escalating SMS reminders — at Day 7, Day 14, Day 21 — until every high-risk referral is closed.
4. **Offline-First Mobile** — Because rural India means intermittent connectivity. Registrations should never fail due to poor signal.

---

## Conclusion

BharatCare Link is not just a technical project. It is an argument that **AI should serve those who need it most**.

The ASHA worker walking to her 12th household of the day, in the summer heat, with limited education and a basic smartphone — she deserves the same quality of tools as a doctor in a metropolitan hospital.

We have built the foundation. The AI understands her. The data is tracked. The PHC can respond.

**The rest is scale.**
