module.exports = {
    UserPool: {
        Type: 'AWS::Cognito::UserPool',
        Properties: {
            UserPoolName: { 'Fn::Sub': '${ProjectName}-user-pool-${Environment}' },
            Policies: {
                PasswordPolicy: {
                    MinimumLength: 8,
                    RequireLowercase: false,
                    RequireNumbers: false,
                    RequireSymbols: false,
                    RequireUppercase: false
                }
            },
            AutoVerifiedAttributes: ['email']
        }
    },
    UserPoolClient: {
        Type: 'AWS::Cognito::UserPoolClient',
        Properties: {
            ClientName: { 'Fn::Sub': '${ProjectName}-client-${Environment}' },
            UserPoolId: { Ref: 'UserPool' },
            GenerateSecret: false,
            ExplicitAuthFlows: [
                'ALLOW_USER_PASSWORD_AUTH',
                'ALLOW_REFRESH_TOKEN_AUTH',
                'ALLOW_USER_SRP_AUTH'
            ]
        }
    }
};
