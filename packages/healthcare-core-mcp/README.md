# Healthcare Core MCP Server

This is the MCP (Model Context Protocol) server for the BharatCare Link project. It provides tools for patient registration and specialist referrals, backed by Amazon DynamoDB.

## Features
- **Register Patient**: Adds a new patient record to the `Patients` table.
- **Create Referral**: Links a patient to a specialist in the `Referrals` table.
- **List Patients**: View recent patient registrations.
- **Get Patient Referrals**: Retrieve all referrals for a specific patient.

## Local Development

### 1. Requirements
- Python 3.10+
- `uv` package manager

### 2. Setup
```bash
uv sync
```

### 3. Running locally (SSE)
```bash
# Set environment variables
export PATIENTS_TABLE=ai-bharat-care-link-patients-dev
export REFERRALS_TABLE=ai-bharat-care-link-referrals-dev
export AWS_REGION=us-east-1

# Start the server
uv run python main.py
```
The server will start an SSE endpoint at `http://localhost:8000/sse`.

## Lambda Deployment

This server is designed to be deployed as an AWS Lambda function. The entry point is the `handler` object in `main.py`.

### Environment Variables for Lambda
- `PATIENTS_TABLE`: Name of your Patients DynamoDB table (e.g., `ai-bharat-care-link-patients-dev`).
- `REFERRALS_TABLE`: Name of your Referrals DynamoDB table (e.g., `ai-bharat-care-link-referrals-dev`).
- `AWS_REGION`: AWS region.

## Data Schema (Multi-Table)
### Patients Table
- Table Name: `ai-bharat-care-link-patients-dev`
- Partition Key: `PatientID` (e.g., `PAT#123`)
- Attributes: `Name`, `Age`, `Condition`, `CreatedAt`, `Status`

### Referrals Table
- Table Name: `ai-bharat-care-link-referrals-dev`
- Partition Key: `ReferralID` (e.g., `REF#456`)
- Attributes: `PatientID` (FK), `Specialist`, `Priority`, `Status`, `CreatedAt`
