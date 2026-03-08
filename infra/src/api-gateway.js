module.exports = {
    ChatApi: {
        Type: 'AWS::ApiGatewayV2::Api',
        Properties: {
            Name: { 'Fn::Sub': '${ProjectName}-chat-api-${Environment}' },
            ProtocolType: 'HTTP',
            CorsConfiguration: {
                AllowHeaders: ['*'],
                AllowMethods: ['POST', 'OPTIONS'],
                AllowOrigins: ['*']
            }
        }
    },
    ChatApiIntegration: {
        Type: 'AWS::ApiGatewayV2::Integration',
        Properties: {
            ApiId: { Ref: 'ChatApi' },
            IntegrationType: 'AWS_PROXY',
            IntegrationUri: { 'Fn::GetAtt': ['ChatOrchestratorFunction', 'Arn'] },
            PayloadFormatVersion: '2.0'
        }
    },
    ChatApiRoute: {
        Type: 'AWS::ApiGatewayV2::Route',
        Properties: {
            ApiId: { Ref: 'ChatApi' },
            RouteKey: 'POST /api/chat',
            Target: { 'Fn::Sub': 'integrations/${ChatApiIntegration}' }
        }
    },
    ChatApiStage: {
        Type: 'AWS::ApiGatewayV2::Stage',
        Properties: {
            ApiId: { Ref: 'ChatApi' },
            StageName: '$default',
            AutoDeploy: true
        }
    },
    ChatApiLambdaPermission: {
        Type: 'AWS::Lambda::Permission',
        Properties: {
            FunctionName: { Ref: 'ChatOrchestratorFunction' },
            Action: 'lambda:InvokeFunction',
            Principal: 'apigateway.amazonaws.com',
            SourceArn: { 'Fn::Sub': 'arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${ChatApi}/*' }
        }
    },
    RecordsApiIntegration: {
        Type: 'AWS::ApiGatewayV2::Integration',
        Properties: {
            ApiId: { Ref: 'ChatApi' },
            IntegrationType: 'AWS_PROXY',
            IntegrationUri: { 'Fn::GetAtt': ['RecordsOrchestratorFunction', 'Arn'] },
            PayloadFormatVersion: '2.0'
        }
    },
    RecordsApiRoute: {
        Type: 'AWS::ApiGatewayV2::Route',
        Properties: {
            ApiId: { Ref: 'ChatApi' },
            RouteKey: 'GET /api/records',
            Target: { 'Fn::Sub': 'integrations/${RecordsApiIntegration}' }
        }
    },
    RecordsApiLambdaPermission: {
        Type: 'AWS::Lambda::Permission',
        Properties: {
            FunctionName: { Ref: 'RecordsOrchestratorFunction' },
            Action: 'lambda:InvokeFunction',
            Principal: 'apigateway.amazonaws.com',
            SourceArn: { 'Fn::Sub': 'arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${ChatApi}/*' }
        }
    }
};
