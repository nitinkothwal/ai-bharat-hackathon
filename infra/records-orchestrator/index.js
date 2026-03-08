const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, ScanCommand } = require("@aws-sdk/lib-dynamodb");

// --- DynamoDB Configuration ---
const client = new DynamoDBClient({
    region: (process.env.AWS_REGION || "us-east-1").replace(/"/g, ''),
});
const docClient = DynamoDBDocumentClient.from(client);

// Default table names as fallbacks
const PATIENTS_TABLE = (process.env.PATIENTS_TABLE || "ai-bharat-care-link-patients-dev").replace(/"/g, '');
const REFERRALS_TABLE = (process.env.REFERRALS_TABLE || "ai-bharat-care-link-referrals-dev").replace(/"/g, '');

exports.handler = async (event) => {
    // API Gateway HTTP API Payload V2 uses event.queryStringParameters
    const type = (event.queryStringParameters && event.queryStringParameters.type) || null;

    console.log(`[Lambda] Fetching records for type: ${type}`);

    try {
        let tableName;
        if (type === "patients") {
            tableName = PATIENTS_TABLE;
        } else if (type === "referrals") {
            tableName = REFERRALS_TABLE;
        } else {
            return {
                statusCode: 400,
                headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
                body: JSON.stringify({ success: false, error: "Invalid type. Must be 'patients' or 'referrals'." })
            };
        }

        const command = new ScanCommand({
            TableName: tableName,
            Limit: 50,
        });

        const result = await docClient.send(command);

        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type"
            },
            body: JSON.stringify({
                success: true,
                items: result.Items || []
            })
        };

    } catch (error) {
        console.error(`[Lambda] DynamoDB Error:`, error.name, error.message);
        return {
            statusCode: 500,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({
                success: false,
                error: error.message || "Failed to fetch records from DynamoDB"
            })
        };
    }
};
