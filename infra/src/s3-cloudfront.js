module.exports = {
    WebAppBucket: {
        Type: 'AWS::S3::Bucket',
        Properties: {
            BucketName: { 'Fn::Sub': '${ProjectName}-webapp-${Environment}-${AWS::AccountId}' },
            PublicAccessBlockConfiguration: {
                BlockPublicAcls: true,
                BlockPublicPolicy: true,
                IgnorePublicAcls: true,
                RestrictPublicBuckets: true
            }
        }
    },
    CloudFrontOAC: {
        Type: 'AWS::CloudFront::OriginAccessControl',
        Properties: {
            OriginAccessControlConfig: {
                Description: 'OAC for Web App S3 bucket',
                Name: { 'Fn::Sub': '${AWS::StackName}-WebApp-OAC' },
                OriginAccessControlOriginType: 's3',
                SigningBehavior: 'always',
                SigningProtocol: 'sigv4'
            }
        }
    },
    WebAppDistribution: {
        Type: 'AWS::CloudFront::Distribution',
        Properties: {
            DistributionConfig: {
                Origins: [
                    {
                        DomainName: { 'Fn::GetAtt': ['WebAppBucket', 'RegionalDomainName'] },
                        Id: 'S3Origin',
                        S3OriginConfig: {
                            OriginAccessIdentity: ''
                        },
                        OriginAccessControlId: { 'Fn::GetAtt': ['CloudFrontOAC', 'Id'] }
                    },
                    {
                        // Use the API Gateway endpoint as an origin
                        DomainName: { 'Fn::Sub': '${ChatApi}.execute-api.${AWS::Region}.amazonaws.com' },
                        Id: 'ApiOrigin',
                        CustomOriginConfig: {
                            HTTPPort: 80,
                            HTTPSPort: 443,
                            OriginProtocolPolicy: 'https-only'
                        }
                    }
                ],
                Enabled: true,
                DefaultRootObject: 'index.html',
                CacheBehaviors: [
                    {
                        PathPattern: '/api/*',
                        TargetOriginId: 'ApiOrigin',
                        ViewerProtocolPolicy: 'redirect-to-https',
                        AllowedMethods: ['GET', 'HEAD', 'OPTIONS', 'PUT', 'PATCH', 'POST', 'DELETE'],
                        CachedMethods: ['GET', 'HEAD'],
                        ForwardedValues: {
                            QueryString: true,
                            Headers: ['Authorization', 'x-request-id', 'Content-Type', 'Accept'],
                            Cookies: { Forward: 'all' }
                        },
                        MinTTL: 0,
                        DefaultTTL: 0,
                        MaxTTL: 0,
                        Compress: true
                    }
                ],
                DefaultCacheBehavior: {
                    TargetOriginId: 'S3Origin',
                    ViewerProtocolPolicy: 'redirect-to-https',
                    CachePolicyId: '658327ea-f89d-4fab-a63d-7e88639e58f6', // Managed-CachingOptimized
                    AllowedMethods: ['GET', 'HEAD', 'OPTIONS'],
                    CachedMethods: ['GET', 'HEAD'],
                    Compress: true
                },
                PriceClass: 'PriceClass_100',
                ViewerCertificate: {
                    CloudFrontDefaultCertificate: true
                },
                CustomErrorResponses: [
                    {
                        ErrorCode: 403,
                        ResponsePagePath: '/index.html',
                        ResponseCode: 200,
                        ErrorCachingMinTTL: 10
                    },
                    {
                        ErrorCode: 404,
                        ResponsePagePath: '/index.html',
                        ResponseCode: 200,
                        ErrorCachingMinTTL: 10
                    }
                ]
            }
        }
    },
    WebAppBucketPolicy: {
        Type: 'AWS::S3::BucketPolicy',
        Properties: {
            Bucket: { Ref: 'WebAppBucket' },
            PolicyDocument: {
                Version: '2012-10-17',
                Statement: [
                    {
                        Action: 's3:GetObject',
                        Effect: 'Allow',
                        Resource: { 'Fn::Sub': 'arn:aws:s3:::${WebAppBucket}/*' },
                        Principal: {
                            Service: 'cloudfront.amazonaws.com'
                        },
                        Condition: {
                            StringEquals: {
                                'AWS:SourceArn': {
                                    'Fn::Sub': 'arn:aws:cloudfront::${AWS::AccountId}:distribution/${WebAppDistribution}'
                                }
                            }
                        }
                    }
                ]
            }
        }
    }
};
