module.exports = {
    ChatOrchestratorFunction: {
        Type: 'AWS::Lambda::Function',
        Properties: {
            FunctionName: { 'Fn::Sub': '${ProjectName}-chat-orchestrator-${Environment}' },
            Handler: 'index.handler',
            Role: { 'Fn::GetAtt': ['MCPServerRole', 'Arn'] }, // Reusing role as it has Bedrock and Dynamo access (needed for Bedrock)
            Runtime: 'nodejs22.x',
            Timeout: 30,
            MemorySize: 1024,
            Code: {
                S3Bucket: { Ref: 'DeploymentBucket' },
                S3Key: 'chat-orchestrator/code.zip'
            },
            Environment: {
                Variables: {
                    MCP_SERVER_URL: 'https://bedrock-agentcore.us-east-1.amazonaws.com/runtimes/arn%3Aaws%3Abedrock-agentcore%3Aus-east-1%3A771354139195%3Aruntime%2FHealthcareMCP-k6TrCW8UIz/invocations?qualifier=DEFAULT',
                    COGNITO_CLIENT_ID: '4p2ecem1703d2ohq0u8biubfjj',
                    COGNITO_USERNAME: 'nitin.kothwal@sarvaha.com',
                    COGNITO_PASSWORD: 'As#r15Pn^92',
                    PATIENTS_TABLE: { Ref: 'PatientsTable' },
                    REFERRALS_TABLE: { Ref: 'ReferralsTable' },
                    AWS_BEDROCK_REGION: { Ref: 'AWS::Region' }
                }
            }
        }
    },
    RecordsOrchestratorFunction: {
        Type: 'AWS::Lambda::Function',
        Properties: {
            FunctionName: { 'Fn::Sub': '${ProjectName}-records-orchestrator-${Environment}' },
            Handler: 'index.handler',
            Role: { 'Fn::GetAtt': ['MCPServerRole', 'Arn'] },
            Runtime: 'nodejs18.x',
            Code: {
                S3Bucket: { Ref: 'DeploymentBucket' },
                S3Key: 'records-orchestrator/code.zip'
            },
            Timeout: 30,
            Environment: {
                Variables: {
                    PATIENTS_TABLE: { Ref: 'PatientsTable' },
                    REFERRALS_TABLE: { Ref: 'ReferralsTable' }
                }
            }
        }
    }
};
