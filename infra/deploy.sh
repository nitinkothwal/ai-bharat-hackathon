#!/bin/bash

# Bharat Care Link Deployment Script
# Deploys Infrastructure, MCP Server, Orchestrator and Web App

set -e

echo "🚀 Starting Bharat Care Link full deployment..."

# Configuration
STACK_NAME="ai-bharat-care-link-stack"
REGION="us-east-1"
# Get absolute path of the workspace root (one level up from infra/)
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
INFRA_DIR="$ROOT_DIR/infra"

# Get account ID for unique bucket names
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
DEPLOYMENT_BUCKET_NAME="ai-bharat-deploy-${ACCOUNT_ID}-${REGION}"

# Step 1: Build CloudFormation template
echo "🏗️ Building CloudFormation template..."
cd "$INFRA_DIR"
node build.js

# Step 2: Package Chat Orchestrator (Node.js)
echo "🔄 Syncing AI logic..."
cd "$INFRA_DIR"
node sync-logic.js

echo "📦 Packaging Chat Orchestrator..."
cd "$INFRA_DIR/chat-orchestrator"
rm -rf node_modules package-lock.json code.zip
npm install --production --silent
zip -q -r code.zip index.js node_modules package.json
echo "✅ Chat Orchestrator package created"

echo "📦 Packaging Records Orchestrator..."
cd "$INFRA_DIR/records-orchestrator"
rm -rf node_modules package-lock.json code.zip
npm install --production --silent
zip -q -r code.zip index.js node_modules package.json
echo "✅ Records Orchestrator package created"

# Step 3: Create Deployment Bucket if needed
cd "$INFRA_DIR"
if aws s3api head-bucket --bucket "$DEPLOYMENT_BUCKET_NAME" 2>/dev/null; then
    echo "📦 Using existing deployment bucket: $DEPLOYMENT_BUCKET_NAME"
else
    echo "📦 Creating deployment bucket: $DEPLOYMENT_BUCKET_NAME"
    aws s3 mb s3://$DEPLOYMENT_BUCKET_NAME --region $REGION
fi

# Step 4: Upload packages to S3
echo "☁️ Uploading packages to S3..."
aws s3 cp "$INFRA_DIR/chat-orchestrator/code.zip" "s3://$DEPLOYMENT_BUCKET_NAME/chat-orchestrator/code.zip" --quiet
aws s3 cp "$INFRA_DIR/records-orchestrator/code.zip" "s3://$DEPLOYMENT_BUCKET_NAME/records-orchestrator/code.zip" --quiet

echo "🔄 Forcing Lambda code update (bypassing CloudFormation if unchanged)..."
aws lambda update-function-code --function-name "ai-bharat-care-link-chat-orchestrator-dev" --s3-bucket "$DEPLOYMENT_BUCKET_NAME" --s3-key "chat-orchestrator/code.zip" --region "$REGION" > /dev/null 2>&1 || true
aws lambda update-function-code --function-name "ai-bharat-care-link-records-orchestrator-dev" --s3-bucket "$DEPLOYMENT_BUCKET_NAME" --s3-key "records-orchestrator/code.zip" --region "$REGION" > /dev/null 2>&1 || true

# Step 5: Deploy CloudFormation Stack
echo "✅ Validating CloudFormation template..."
aws cloudformation validate-template --template-body file://dist/template.json > /dev/null

echo "🚀 Deploying CloudFormation stack: $STACK_NAME..."
cd "$INFRA_DIR"
STACK_STATUS=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$REGION" --query "Stacks[0].StackStatus" --output text 2>/dev/null || echo "DOES_NOT_EXIST")

if [ "$STACK_STATUS" == "DOES_NOT_EXIST" ]; then
    OPERATION="create-stack"
else
    OPERATION="update-stack"
fi

if [ "$OPERATION" == "create-stack" ]; then
    aws cloudformation create-stack \
        --stack-name $STACK_NAME \
        --template-body file://dist/template.json \
        --capabilities CAPABILITY_NAMED_IAM CAPABILITY_IAM \
        --region $REGION \
        --parameters \
            ParameterKey=DeploymentBucket,ParameterValue=$DEPLOYMENT_BUCKET_NAME
else
    set +e
    OUTPUT=$(aws cloudformation update-stack \
        --stack-name $STACK_NAME \
        --template-body file://dist/template.json \
        --capabilities CAPABILITY_NAMED_IAM CAPABILITY_IAM \
        --region $REGION \
        --parameters \
            ParameterKey=DeploymentBucket,ParameterValue=$DEPLOYMENT_BUCKET_NAME 2>&1)
    EXIT_CODE=$?
    set -e
    
    if [ $EXIT_CODE -ne 0 ]; then
        if [[ "$OUTPUT" == *"No updates are to be performed"* ]]; then
            echo "ℹ️  No infrastructure changes required (template is unchanged)."
        else
            echo "❌ Stack update failed:"
            echo "$OUTPUT"
            exit $EXIT_CODE
        fi
    else
        echo "✅ Infrastructure update initiated."
    fi
fi

echo "⏳ Waiting for stack operation to complete..."
if [ "$OPERATION" = "create-stack" ]; then
    aws cloudformation wait stack-create-complete --stack-name $STACK_NAME --region $REGION || true
else
    aws cloudformation wait stack-update-complete --stack-name $STACK_NAME --region $REGION || true
fi

# Step 6: Get Stack Outputs
echo "📋 Retrieving stack outputs..."
WEB_APP_BUCKET=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --region $REGION --query 'Stacks[0].Outputs[?OutputKey==`WebAppBucket`].OutputValue' --output text)
WEB_APP_URL=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --region $REGION --query 'Stacks[0].Outputs[?OutputKey==`WebAppUrl`].OutputValue' --output text)
USER_POOL_ID=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --region $REGION --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' --output text)
CLIENT_ID=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --region $REGION --query 'Stacks[0].Outputs[?OutputKey==`UserPoolClientId`].OutputValue' --output text)

# Step 7: Build and Upload Web App
if [[ "$*" != *"--skip-webapp"* ]]; then
    echo "🏗️ Building Web App..."
    cd "$ROOT_DIR/apps/asha-web"
    
    # Temporarily hide API routes from static export
    if [ -d "app/api" ]; then
        mv app/api app/_api
    fi
    
    npm install --silent
    STATIC_EXPORT=true npm run build
    
    # Restore API routes for local development
    if [ -d "app/_api" ]; then
        mv app/_api app/api
    fi

    echo "📤 Uploading Web App to S3: $WEB_APP_BUCKET..."
    aws s3 sync out/ "s3://$WEB_APP_BUCKET/" --delete --quiet

    echo "🧹 Invalidating CloudFront cache..."
    DIST_ID=$(aws cloudformation describe-stack-resources --stack-name $STACK_NAME --region $REGION --query 'StackResources[?LogicalResourceId==`WebAppDistribution`].PhysicalResourceId' --output text)
    aws cloudfront create-invalidation --distribution-id $DIST_ID --paths "/*" --region $REGION
else
    echo "⏭️ Skipping Web App deployment"
fi

echo ""
echo "🎉 Deployment Successful!"
echo "=========================="
echo "🌐 Web App URL: $WEB_APP_URL"
echo "🔑 User Pool ID: $USER_POOL_ID"
echo "🆔 Client ID: $CLIENT_ID"
echo "=========================="
