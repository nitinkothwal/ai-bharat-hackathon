#!/usr/bin/env node

// Simple test script to verify API integration
const fetch = require('node-fetch');

const API_BASE_URL = 'https://al3mct64tk.execute-api.ap-south-1.amazonaws.com/v1';

async function testAPI() {
    console.log('🧪 Testing Bharat CareLink API Integration...\n');
    
    try {
        // Test 1: Health check (GET /auth/health)
        console.log('1. Testing health endpoint...');
        const healthResponse = await fetch(`${API_BASE_URL}/auth/health`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        const healthData = await healthResponse.json();
        console.log('✅ Health check:', {
            status: healthResponse.status,
            data: healthData
        });
        
        // Test 2: Send OTP (POST /auth/login)
        console.log('\n2. Testing OTP send...');
        const otpResponse = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                mobile_number: '9876543210' // Test mobile number
            })
        });
        
        const otpData = await otpResponse.json();
        console.log('📱 OTP Response:', {
            status: otpResponse.status,
            data: otpData
        });
        
        if (otpResponse.status === 404) {
            console.log('ℹ️  This is expected - no test user exists yet');
            console.log('💡 You need to create a test user in the DynamoDB users table');
        }
        
        // Test 3: Test OTP verification endpoint (POST /auth/otp-verify)
        console.log('\n3. Testing OTP verification endpoint...');
        const verifyResponse = await fetch(`${API_BASE_URL}/auth/otp-verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                mobile_number: '9876543210',
                otp: '123456'
            })
        });
        
        const verifyData = await verifyResponse.json();
        console.log('🔐 OTP Verify Response:', {
            status: verifyResponse.status,
            data: verifyData
        });
        
    } catch (error) {
        console.error('❌ API Test Error:', error.message);
    }
}

testAPI();