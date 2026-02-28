module.exports = {
    CloudFrontDomainName: {
        Value: {
            "Fn::GetAtt": [
                "CloudFrontDistribution",
                "DomainName"
            ]
        },
        Description: "The domain name of the CloudFront distribution."
    },
    S3BucketName: {
        Value: {
            Ref: "S3Bucket"
        },
        Description: "The name of the S3 bucket."
    },
    BackendRoleArn: {
        Value: {
            "Fn::GetAtt": [
                "BackendEC2Role",
                "Arn"
            ]
        },
        Description: "ARN of the EC2 Backend Role"
    },
    BackendInstanceProfileArn: {
        Value: {
            "Fn::GetAtt": [
                "BackendInstanceProfile",
                "Arn"
            ]
        },
        Description: "ARN of the Instance Profile to attach to EC2 instances"
    },
    EnvironmentURL: {
        Value: {
            "Fn::GetAtt": [
                "EBEnvironment",
                "EndpointURL"
            ]
        },
        Description: "URL of the Elastic Beanstalk Environment"
    },
    RDSEndpoint: {
        Value: {
            "Fn::GetAtt": [
                "MySQLDatabase",
                "Endpoint.Address"
            ]
        },
        Description: "RDS MySQL Endpoint Address"
    },
    RDSPort: {
        Value: {
            "Fn::GetAtt": [
                "MySQLDatabase",
                "Endpoint.Port"
            ]
        },
        Description: "RDS MySQL Port"
    }
};
