#!/usr/bin/env node

// Script to create a test user in DynamoDB
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const dynamoClient = new DynamoDBClient({ region: 'ap-south-1' });
const dynamodb = DynamoDBDocumentClient.from(dynamoClient);

async function createTestUser() {
    console.log('👤 Creating test ASHA user...\n');
    
    const testUser = {
        user_id: 'asha_test_001',
        full_name: 'Test ASHA Worker',
        mobile_number: '9876543210',
        role: 'asha_worker',
        asha_code: 'ASH001',
        phc_code: 'PHC001',
        district_code: 'DIST001',
        state_code: 'ST001',
        is_active: true,
        created_at: Date.now(),
        updated_at: Date.now(),
        last_login_at: null,
        failed_login_attempts: 0
    };
    
    try {
        await dynamodb.send(new PutCommand({
            TableName: 'bharat-carelink-users',
            Item: testUser,
            ConditionExpression: 'attribute_not_exists(user_id)'
        }));
        
        console.log('✅ Test user created successfully!');
        console.log('📱 Mobile: 9876543210');
        console.log('👤 Name: Test ASHA Worker');
        console.log('🏥 ASHA Code: ASH001');
        console.log('\nYou can now test OTP login with mobile number: 9876543210');
        
    } catch (error) {
        if (error.name === 'ConditionalCheckFailedException') {
            console.log('ℹ️  Test user already exists');
        } else {
            console.error('❌ Error creating test user:', error.message);
        }
    }
}

createTestUser();