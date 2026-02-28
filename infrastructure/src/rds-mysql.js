module.exports = {
    RDSSecurityGroup: {
        Type: "AWS::EC2::SecurityGroup",
        Properties: {
            GroupDescription: "Allow MySQL access from anywhere for hackathon development",
            SecurityGroupIngress: [
                {
                    IpProtocol: "tcp",
                    FromPort: "3306",
                    ToPort: "3306",
                    CidrIp: "0.0.0.0/0"
                }
            ]
        }
    },
    MySQLDatabase: {
        Type: "AWS::RDS::DBInstance",
        Properties: {
            Engine: "mysql",
            EngineVersion: "8.0",
            DBInstanceClass: { Ref: "DBInstanceClass" },
            AllocatedStorage: "20",
            DBName: { Ref: "DBName" },
            MasterUsername: { Ref: "DBUsername" },
            MasterUserPassword: { Ref: "DBPassword" },
            VPCSecurityGroups: [{ "Fn::GetAtt": ["RDSSecurityGroup", "GroupId"] }],
            PubliclyAccessible: true,
            StorageType: "gp2",
            DeleteAutomatedBackups: true
        }
    }
};
