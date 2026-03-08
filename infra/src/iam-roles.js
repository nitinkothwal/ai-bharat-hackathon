module.exports = {
    MCPServerRole: {
        Type: 'AWS::IAM::Role',
        Properties: {
            AssumeRolePolicyDocument: {
                Version: '2012-10-17',
                Statement: [
                    {
                        Effect: 'Allow',
                        Principal: {
                            Service: [
                                'lambda.amazonaws.com',
                                'bedrock.amazonaws.com'
                            ]
                        },
                        Action: 'sts:AssumeRole'
                    }
                ]
            },
            ManagedPolicyArns: [
                'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
            ],
            Policies: [
                {
                    PolicyName: 'DynamoDBAccess',
                    PolicyDocument: {
                        Version: '2012-10-17',
                        Statement: [
                            {
                                Effect: 'Allow',
                                Action: [
                                    'dynamodb:PutItem',
                                    'dynamodb:GetItem',
                                    'dynamodb:UpdateItem',
                                    'dynamodb:DeleteItem',
                                    'dynamodb:Query',
                                    'dynamodb:Scan',
                                    'dynamodb:DescribeTable'
                                ],
                                Resource: [
                                    { 'Fn::GetAtt': ['PatientsTable', 'Arn'] },
                                    { 'Fn::GetAtt': ['ReferralsTable', 'Arn'] },
                                    { 'Fn::Sub': '${PatientsTable.Arn}/index/*' },
                                    { 'Fn::Sub': '${ReferralsTable.Arn}/index/*' }
                                ]
                            }
                        ]
                    }
                },
                {
                    PolicyName: 'BedrockAccess',
                    PolicyDocument: {
                        Version: '2012-10-17',
                        Statement: [
                            {
                                Effect: 'Allow',
                                Action: [
                                    'bedrock:InvokeModel',
                                    'bedrock:InvokeModelWithResponseStream'
                                ],
                                Resource: '*'
                            }
                        ]
                    }
                }
            ]
        }
    }
};
