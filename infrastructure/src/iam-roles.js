module.exports = {
    BackendEC2Role: {
        Type: "AWS::IAM::Role",
        Properties: {
            RoleName: "BharatCareLinkBackendRole",
            AssumeRolePolicyDocument: {
                Version: "2012-10-17",
                Statement: [
                    {
                        Effect: "Allow",
                        Principal: {
                            Service: [
                                "ec2.amazonaws.com"
                            ]
                        },
                        Action: [
                            "sts:AssumeRole"
                        ]
                    }
                ]
            },
            ManagedPolicyArns: [
                "arn:aws:iam::aws:policy/AWSElasticBeanstalkWebTier",
                "arn:aws:iam::aws:policy/AWSElasticBeanstalkMulticontainerDocker",
                "arn:aws:iam::aws:policy/AWSElasticBeanstalkWorkerTier",
                "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
            ],
            Policies: [
                {
                    PolicyName: "BharatCareLinkServicesAccess",
                    PolicyDocument: {
                        Version: "2012-10-17",
                        Statement: [
                            {
                                Sid: "S3Access",
                                Effect: "Allow",
                                Action: [
                                    "s3:PutObject",
                                    "s3:GetObject",
                                    "s3:ListBucket",
                                    "s3:DeleteObject"
                                ],
                                Resource: [
                                    "arn:aws:s3:::bharat-carelink-*",
                                    "arn:aws:s3:::bharat-carelink-*/*"
                                ]
                            },
                            {
                                Sid: "DynamoDBAccess",
                                Effect: "Allow",
                                Action: [
                                    "dynamodb:PutItem",
                                    "dynamodb:GetItem",
                                    "dynamodb:UpdateItem",
                                    "dynamodb:DeleteItem",
                                    "dynamodb:Query",
                                    "dynamodb:Scan"
                                ],
                                Resource: [
                                    "arn:aws:dynamodb:*:*:table/bharat-carelink-*",
                                    "arn:aws:dynamodb:*:*:table/bharat-carelink-*/index/*"
                                ]
                            },
                            {
                                Sid: "CognitoAccess",
                                Effect: "Allow",
                                Action: [
                                    "cognito-idp:AdminGetUser",
                                    "cognito-idp:AdminCreateUser",
                                    "cognito-idp:AdminUpdateUserAttributes",
                                    "cognito-idp:ListUsers",
                                    "cognito-idp:AdminInitiateAuth"
                                ],
                                Resource: [
                                    "arn:aws:cognito-idp:*:*:userpool/*"
                                ]
                            },
                            {
                                Sid: "BedrockAccess",
                                Effect: "Allow",
                                Action: [
                                    "bedrock:InvokeModel",
                                    "bedrock:InvokeModelWithResponseStream"
                                ],
                                Resource: [
                                    "arn:aws:bedrock:*:*:foundation-model/anthropic.claude-3-5-sonnet*"
                                ]
                            },
                            {
                                Sid: "SageMakerAccess",
                                Effect: "Allow",
                                Action: [
                                    "sagemaker:InvokeEndpoint"
                                ],
                                Resource: [
                                    "arn:aws:sagemaker:*:*:endpoint/*risk-endpoint*"
                                ]
                            },
                            {
                                Sid: "TranscribeAccess",
                                Effect: "Allow",
                                Action: [
                                    "transcribe:StartTranscriptionJob",
                                    "transcribe:GetTranscriptionJob",
                                    "transcribe:ListTranscriptionJobs"
                                ],
                                Resource: "*"
                            },
                            {
                                Sid: "TranslateAccess",
                                Effect: "Allow",
                                Action: [
                                    "translate:TranslateText"
                                ],
                                Resource: "*"
                            },
                            {
                                Sid: "EventBridgeAccess",
                                Effect: "Allow",
                                Action: [
                                    "events:PutEvents"
                                ],
                                Resource: [
                                    "arn:aws:events:*:*:event-bus/bharat-carelink-events",
                                    "arn:aws:events:*:*:event-bus/default"
                                ]
                            },
                            {
                                Sid: "SNSAccess",
                                Effect: "Allow",
                                Action: [
                                    "sns:Publish"
                                ],
                                Resource: "*"
                            },
                            {
                                Sid: "KMSAccess",
                                Effect: "Allow",
                                Action: [
                                    "kms:Decrypt",
                                    "kms:Encrypt",
                                    "kms:GenerateDataKey"
                                ],
                                Resource: "*"
                            }
                        ]
                    }
                }
            ]
        }
    },
    BackendInstanceProfile: {
        Type: "AWS::IAM::InstanceProfile",
        Properties: {
            InstanceProfileName: "BharatCareLinkBackendInstanceProfile",
            Roles: [
                {
                    Ref: "BackendEC2Role"
                }
            ]
        }
    }
};
