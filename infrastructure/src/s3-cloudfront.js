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
                    }
                ],
                Enabled: true,
                DefaultRootObject: "index.html",
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
                HttpVersion: "http2"
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
