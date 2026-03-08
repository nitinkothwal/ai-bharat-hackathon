module.exports = {
    PatientsTable: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
            TableName: { 'Fn::Sub': '${ProjectName}-patients-${Environment}' },
            BillingMode: 'PAY_PER_REQUEST',
            AttributeDefinitions: [
                { AttributeName: 'PatientID', AttributeType: 'S' }
            ],
            KeySchema: [
                { AttributeName: 'PatientID', KeyType: 'HASH' }
            ],
            SSESpecification: {
                SSEEnabled: true
            }
        }
    },
    ReferralsTable: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
            TableName: { 'Fn::Sub': '${ProjectName}-referrals-${Environment}' },
            BillingMode: 'PAY_PER_REQUEST',
            AttributeDefinitions: [
                { AttributeName: 'ReferralID', AttributeType: 'S' },
                { AttributeName: 'PatientID', AttributeType: 'S' }
            ],
            KeySchema: [
                { AttributeName: 'ReferralID', KeyType: 'HASH' }
            ],
            GlobalSecondaryIndexes: [
                {
                    IndexName: 'PatientIndex',
                    KeySchema: [
                        { AttributeName: 'PatientID', KeyType: 'HASH' }
                    ],
                    Projection: {
                        ProjectionType: 'ALL'
                    }
                }
            ],
            SSESpecification: {
                SSEEnabled: true
            }
        }
    }
};
