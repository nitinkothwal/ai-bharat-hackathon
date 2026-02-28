module.exports = {
    EBApplication: {
        Type: "AWS::ElasticBeanstalk::Application",
        Properties: {
            ApplicationName: {
                Ref: "ApplicationName"
            },
            Description: "Node.js Application for AI Bharat Hackathon Backend API"
        }
    },
    EBEnvironment: {
        Type: "AWS::ElasticBeanstalk::Environment",
        Properties: {
            ApplicationName: {
                Ref: "EBApplication"
            },
            EnvironmentName: {
                Ref: "EnvironmentName"
            },
            SolutionStackName: {
                Ref: "SolutionStackName"
            },
            OptionSettings: [
                {
                    Namespace: "aws:autoscaling:launchconfiguration",
                    OptionName: "IamInstanceProfile",
                    Value: {
                        Ref: "BackendInstanceProfile"
                    }
                },
                {
                    Namespace: "aws:autoscaling:launchconfiguration",
                    OptionName: "InstanceType",
                    Value: {
                        Ref: "InstanceType"
                    }
                },
                {
                    Namespace: "aws:elasticbeanstalk:environment",
                    OptionName: "EnvironmentType",
                    Value: "LoadBalanced"
                },
                {
                    Namespace: "aws:elasticbeanstalk:application:environment",
                    OptionName: "DB_HOST",
                    Value: {
                        "Fn::GetAtt": ["MySQLDatabase", "Endpoint.Address"]
                    }
                },
                {
                    Namespace: "aws:elasticbeanstalk:application:environment",
                    OptionName: "DB_PORT",
                    Value: {
                        "Fn::GetAtt": ["MySQLDatabase", "Endpoint.Port"]
                    }
                },
                {
                    Namespace: "aws:elasticbeanstalk:application:environment",
                    OptionName: "DB_USER",
                    Value: { Ref: "DBUsername" }
                },
                {
                    Namespace: "aws:elasticbeanstalk:application:environment",
                    OptionName: "DB_PASSWORD",
                    Value: { Ref: "DBPassword" }
                },
                {
                    Namespace: "aws:elasticbeanstalk:application:environment",
                    OptionName: "DB_NAME",
                    Value: { Ref: "DBName" }
                },
                {
                    Namespace: "aws:elasticbeanstalk:application:environment",
                    OptionName: "PORT",
                    Value: { Ref: "AppPort" }
                },
                {
                    Namespace: "aws:elasticbeanstalk:application:environment",
                    OptionName: "NODE_ENV",
                    Value: { Ref: "NodeEnv" }
                },
                {
                    Namespace: "aws:elasticbeanstalk:application:environment",
                    OptionName: "SESSION_SECRET",
                    Value: { Ref: "SessionSecret" }
                },
                {
                    Namespace: "aws:elasticbeanstalk:application:environment",
                    OptionName: "DB_SSL",
                    Value: { Ref: "DbSsl" }
                },
                {
                    Namespace: "aws:elasticbeanstalk:application:environment",
                    OptionName: "AWS_REGION",
                    Value: { "Ref": "AWS::Region" }
                }
            ]
        }
    }
};
