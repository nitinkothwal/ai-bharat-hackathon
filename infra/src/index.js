module.exports = {
    AWSTemplateFormatVersion: '2010-09-09',
    Parameters: {
        ...require('./parameters'),
        DeploymentBucket: {
            Type: 'String',
            Description: 'Bucket for deployment artifacts'
        }
    },
    Resources: {
        ...require('./dynamodb'),
        ...require('./iam-roles'),
        ...require('./lambda-functions'),
        ...require('./api-gateway'),
        ...require('./s3-cloudfront'),
        ...require('./cognito')
    },
    Outputs: {
        ApiUrl: {
            Description: 'URL for the API Gateway endpoint',
            Value: { 'Fn::Sub': 'https://${ChatApi}.execute-api.${AWS::Region}.amazonaws.com' }
        },
        WebAppUrl: {
            Description: 'URL for the CloudFront Web App Distribution',
            Value: { 'Fn::Sub': 'https://${WebAppDistribution.DomainName}' }
        },
        ChatOrchestratorUrl: {
            Description: 'URL for the Chat Orchestrator via API Gateway',
            Value: { 'Fn::Sub': 'https://${ChatApi}.execute-api.${AWS::Region}.amazonaws.com/api/chat' }
        },
        WebAppBucket: {
            Description: 'S3 Bucket for Web App hosting',
            Value: { Ref: 'WebAppBucket' }
        },
        PatientsTable: {
            Value: { Ref: 'PatientsTable' }
        },
        ReferralsTable: {
            Value: { Ref: 'ReferralsTable' }
        },
        UserPoolId: {
            Description: 'Cognito User Pool ID',
            Value: { Ref: 'UserPool' }
        },
        UserPoolClientId: {
            Description: 'Cognito User Pool Client ID',
            Value: { Ref: 'UserPoolClient' }
        },
        CognitoDiscoveryUrl: {
            Description: 'Discovery URL for Cognito',
            Value: { 'Fn::Sub': 'https://cognito-idp.${AWS::Region}.amazonaws.com/${UserPool}/.well-known/openid-configuration' }
        },
        MCPServerRoleArn: {
            Description: 'ARN of the IAM Role for MCP Server',
            Value: { 'Fn::GetAtt': ['MCPServerRole', 'Arn'] }
        }
    }
};
