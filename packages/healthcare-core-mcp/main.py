import os
import uuid
import datetime
import boto3
from mcp.server.fastmcp import FastMCP
from starlette.responses import JSONResponse

# Initialize FastMCP Server for Bedrock AgentCore
mcp = FastMCP(
    "HealthcareCore", 
    instructions="I am a medical assistant MCP server for patient registration and referrals.",
    host="0.0.0.0",
    stateless_http=True
)

# DynamoDB Setup
PATIENTS_TABLE = os.getenv("PATIENTS_TABLE", "ai-bharat-care-link-patients-dev")
REFERRALS_TABLE = os.getenv("REFERRALS_TABLE", "ai-bharat-care-link-referrals-dev")
REGION = os.getenv("AWS_REGION", "us-east-1")

boto_config = {}
if os.getenv("USE_LOCAL_DYNAMO") == "true":
    boto_config["endpoint_url"] = os.getenv("DYNAMODB_ENDPOINT", "http://localhost:8000")

dynamodb = boto3.resource("dynamodb", region_name=REGION, **boto_config)
patients_table = dynamodb.Table(PATIENTS_TABLE)
referrals_table = dynamodb.Table(REFERRALS_TABLE)

@mcp.tool()
def register_patient(name: str, age: int, condition: str) -> dict:
    """
    Registers a new patient into BharatCare Link system.
    
    Args:
        name: Full name of the patient.
        age: Age of the patient.
        condition: Primary medical condition or reason for visit.
    """
    # Create the patient record
    patient_hex = uuid.uuid4().hex[:8].upper()
    patient_id = f"PAT#{patient_hex}"
    
    item = {
        "PatientID": patient_id,
        "Name": name,
        "Age": age,
        "Condition": condition,
        "CreatedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "Status": "Active"
    }
    
    try:
        patients_table.put_item(Item=item)
        return {
            "status": "success",
            "patient_id": patient_id,
            "name": name,
            "message": f"Patient {name} registered successfully with ID {patient_id}."
        }
    except Exception as e:
        print(f"Error registering patient: {e}")
        return {"status": "error", "message": str(e)}

@mcp.tool()
def create_referral(patient_id: str, specialist_type: str, priority: str = "medium") -> dict:
    """
    Creates a specialist referral for a registered patient.
    
    Args:
        patient_id: The ID of the patient being referred (must start with PAT#).
        specialist_type: The type of specialist (e.g., 'Cardiologist', 'Dermatologist').
        priority: Urgency level ('low', 'medium', 'high').
    """
    referral_hex = uuid.uuid4().hex[:8].upper()
    referral_id = f"REF#{referral_hex}"
    
    item = {
        "ReferralID": referral_id,
        "PatientID": patient_id,
        "Specialist": specialist_type,
        "Priority": priority,
        "Status": "Pending",
        "CreatedAt": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }
    
    try:
        referrals_table.put_item(Item=item)
        return {
            "status": "success",
            "referral_id": referral_id,
            "patient_id": patient_id,
            "specialist_type": specialist_type,
            "priority": priority,
            "message": f"Referral for patient {patient_id} to a {specialist_type} created successfully."
        }
    except Exception as e:
        print(f"Error creating referral: {e}")
        return {"status": "error", "message": str(e)}

@mcp.tool()
def list_patients(limit: int = 10) -> dict:
    """Lists recent patients from the database."""
    try:
        response = patients_table.scan(Limit=limit)
        return {"patients": response.get("Items", []), "count": response.get("Count", 0)}
    except Exception as e:
        print(f"Error listing patients: {e}")
        return {"status": "error", "message": str(e)}

@mcp.tool()
def get_patient_referrals(patient_id: str) -> dict:
    """
    Retrieves all referrals associated with a specific patient.
    
    Args:
        patient_id: The ID of the patient.
    """
    try:
        # Note: In production, you'd use a Global Secondary Index (GSI) on PatientID in the Referrals table.
        # For simplicity in this demo, we use a filtered scan.
        response = referrals_table.scan(
            FilterExpression="PatientID = :pid",
            ExpressionAttributeValues={":pid": patient_id}
        )
        return {"referrals": response.get("Items", []), "count": response.get("Count", 0)}
    except Exception as e:
        print(f"Error getting referrals: {e}")
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    # Run with streamable-http transport for Bedrock AgentCore
    mcp.run(transport="streamable-http")
