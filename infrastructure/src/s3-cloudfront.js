module.exports = {
    S3Bucket: {
        Type: "AWS::S3::Bucket",
        Properties: {
            BucketName: {
                Ref: "BucketName"
            },
            PublicAccessBlockConfiguration: {
                BlockPublicAcls: true,
                BlockPublicPolicy: true,
                IgnorePublicAcls: true,
                RestrictPublicBuckets: true
            }
        }
    },
    CloudFrontOriginAccessControl: {
        Type: "AWS::CloudFront::OriginAccessControl",
        Properties: {
            OriginAccessControlConfig: {
                Description: "OAC for S3 bucket access",
                Name: {
                    "Fn::Sub": "${AWS::StackName}-OAC"
                },
                OriginAccessControlOriginType: "s3",
                SigningBehavior: "always",
                SigningProtocol: "sigv4"
            }
        }
    },
    CloudFrontDistribution: {
        Type: "AWS::CloudFront::Distribution",
        Properties: {
            DistributionConfig: {
                Origins: [
                    {
                        DomainName: {
                            "Fn::GetAtt": [
                                "S3Bucket",
                                "RegionalDomainName"
                            ]
                        },
                        Id: "S3Origin",
                        OriginPath: {
                            Ref: "OriginPath"
                        },
                        S3OriginConfig: {
                            OriginAccessIdentity: ""
                        },
                        OriginAccessControlId: {
                            "Fn::GetAtt": [
                                "CloudFrontOriginAccessControl",
                                "Id"
                            ]
                        }
                    },
                    {
                        DomainName: {
                            "Fn::GetAtt": [
                                "EBEnvironment",
                                "EndpointURL"
                            ]
                        },
                        Id: "EBOrigin",
                        CustomOriginConfig: {
                            HTTPPort: 80,
                            HTTPSPort: 443,
                            OriginProtocolPolicy: "http-only"
                        }
                    }
                ],
                Enabled: true,
                DefaultRootObject: "index.html",
                CacheBehaviors: [
                    {
                        PathPattern: "/api/*",
                        TargetOriginId: "EBOrigin",
                        ViewerProtocolPolicy: "redirect-to-https",
                        AllowedMethods: [
                            "GET",
                            "HEAD",
                            "OPTIONS",
                            "PUT",
                            "PATCH",
                            "POST",
                            "DELETE"
                        ],
                        CachedMethods: [
                            "GET",
                            "HEAD"
                        ],
                        // Managed-CachingDisabled
                        CachePolicyId: "4135ea2d-6df8-44a3-9df3-4b5a84be39ad",
                        // Managed-AllViewer
                        OriginRequestPolicyId: "216adef6-5c7f-47e4-b989-5492eafa07d3",
                        Compress: true
                    }
                ],
                DefaultCacheBehavior: {
                    TargetOriginId: "S3Origin",
                    ViewerProtocolPolicy: "redirect-to-https",
                    CachePolicyId: "658327ea-f89d-4fab-a63d-7e88639e58f6",
                    AllowedMethods: [
                        "GET",
                        "HEAD",
                        "OPTIONS"
                    ],
                    CachedMethods: [
                        "GET",
                        "HEAD"
                    ],
                    Compress: true
                },
                PriceClass: "PriceClass_100",
                ViewerCertificate: {
                    CloudFrontDefaultCertificate: true
                },
                HttpVersion: "http2",
                CustomErrorResponses: [
                    {
                        ErrorCode: 403,
                        ResponsePagePath: "/index.html",
                        ResponseCode: 200,
                        ErrorCachingMinTTL: 10
                    },
                    {
                        ErrorCode: 404,
                        ResponsePagePath: "/index.html",
                        ResponseCode: 200,
                        ErrorCachingMinTTL: 10
                    }
                ]
            }
        }
    },
    BucketPolicy: {
        Type: "AWS::S3::BucketPolicy",
        Properties: {
            Bucket: {
                Ref: "S3Bucket"
            },
            PolicyDocument: {
                Version: "2012-10-17",
                Statement: [
                    {
                        Action: "s3:GetObject",
                        Effect: "Allow",
                        Resource: {
                            "Fn::Sub": "arn:aws:s3:::${S3Bucket}/*"
                        },
                        Principal: {
                            Service: "cloudfront.amazonaws.com"
                        },
                        Condition: {
                            StringEquals: {
                                "AWS:SourceArn": {
                                    "Fn::Sub": "arn:aws:cloudfront::${AWS::AccountId}:distribution/${CloudFrontDistribution}"
                                }
                            }
                        }
                    }
                ]
            }
        }
    }
};
