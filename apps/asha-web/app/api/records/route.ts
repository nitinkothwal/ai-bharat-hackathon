import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// --- DynamoDB Configuration ---
const client = new DynamoDBClient({
    region: (process.env.AWS_REGION || "us-east-1").replace(/"/g, ''),
});
const docClient = DynamoDBDocumentClient.from(client);

// Default table names as fallbacks
const PATIENTS_TABLE = (process.env.PATIENTS_TABLE || "ai-bharat-care-link-patients-dev").replace(/"/g, '');
const REFERRALS_TABLE = (process.env.REFERRALS_TABLE || "ai-bharat-care-link-referrals-dev").replace(/"/g, '');

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // 'patients' or 'referrals'

    console.log(`[API] Fetching records for type: ${type}`);

    try {
        if (type === "patients") {
            const command = new ScanCommand({
                TableName: PATIENTS_TABLE,
                Limit: 50,
            });
            const result = await docClient.send(command);
            return NextResponse.json({
                success: true,
                items: result.Items || []
            });
        }

        if (type === "referrals") {
            const command = new ScanCommand({
                TableName: REFERRALS_TABLE,
                Limit: 50,
            });
            const result = await docClient.send(command);
            return NextResponse.json({
                success: true,
                items: result.Items || []
            });
        }

        return NextResponse.json({
            success: false,
            error: "Invalid type. Must be 'patients' or 'referrals'."
        }, { status: 400 });

    } catch (error: any) {
        console.error(`[API] DynamoDB Scan Error:`, error.name, error.message);
        return NextResponse.json({
            success: false,
            error: error.message || "Failed to fetch records from DynamoDB"
        }, { status: 500 });
    }
}
