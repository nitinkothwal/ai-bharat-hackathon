module.exports = {
    BucketName: {
        Type: "String",
        Default: "bharat-care-link",
        Description: "The name of the S3 bucket to create."
    },
    OriginPath: {
        Type: "String",
        Default: "/web/dev",
        Description: "The path within the bucket where content is stored."
    },
    ApplicationName: {
        Type: "String",
        Default: "ai-bharat-api",
        Description: "The name of the Elastic Beanstalk Application."
    },
    EnvironmentName: {
        Type: "String",
        Default: "ai-bharat-api-env",
        Description: "The name of the Elastic Beanstalk Environment."
    },
    InstanceType: {
        Type: "String",
        Default: "t4g.micro",
        Description: "The EC2 instance type. t4g.micro is the cheapest ARM64 instance, or t3.micro for x86."
    },
    SolutionStackName: {
        Type: "String",
        Default: "64bit Amazon Linux 2023 v6.8.0 running Node.js 24",
        Description: "The Elastic Beanstalk solution stack name."
    },
    DBName: {
        Type: "String",
        Default: "bharatcaredb",
        Description: "The name of the MySQL database."
    },
    DBUsername: {
        Type: "String",
        Default: "admin",
        Description: "The database admin account username."
    },
    DBPassword: {
        Type: "String",
        NoEcho: true,
        Default: "BharatCare123!",
        Description: "The database admin account password."
    },
    DBInstanceClass: {
        Type: "String",
        Default: "db.t3.micro",
        Description: "The instance type of the RDS instance."
    },
    AppPort: {
        Type: "String",
        Default: "3000",
        Description: "The port the application will listen on."
    },
    NodeEnv: {
        Type: "String",
        Default: "production",
        Description: "The environment name (e.g., production, development)."
    },
    SessionSecret: {
        Type: "String",
        NoEcho: true,
        Default: "A7fK9xQ2mR8tY4vP1zL6cN3bW5eH0uJPS0ny",
        Description: "Secret key for session management."
    },
    DbSsl: {
        Type: "String",
        Default: "false",
        Description: "Whether to use SSL for database connections."
    }
};
