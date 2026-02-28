#!/bin/bash

# Configuration
STACK_NAME="bharat-carelink-infrastructure"
TEMPLATE_FILE="dist/template.json"
REGION="ap-south-1" # Default region, can be overridden

echo "Compiling CloudFormation template from modular JavaScript files..."
node build.js
if [ $? -ne 0 ]; then
    echo "Template compilation failed. Exiting."
    exit 1
fi

# Check if stack exists and is in ROLLBACK_COMPLETE state
STACK_STATUS=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$REGION" --query "Stacks[0].StackStatus" --output text 2>/dev/null)

if [ "$STACK_STATUS" == "ROLLBACK_COMPLETE" ]; then
    echo "Warning: Stack $STACK_NAME is in ROLLBACK_COMPLETE state (failed creation)."
    echo "This stack must be deleted before it can be recreated."
    read -p "Do you want to delete the failed stack and continue? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Deleting failed stack..."
        aws cloudformation delete-stack --stack-name "$STACK_NAME" --region "$REGION"
        echo "Waiting for stack deletion to complete..."
        aws cloudformation wait stack-delete-complete --stack-name "$STACK_NAME" --region "$REGION"
    else
        echo "Exiting."
        exit 1
    fi
fi

echo "Deploying CloudFormation stack: $STACK_NAME..."

# Deploy the stack
aws cloudformation deploy \
    --stack-name "$STACK_NAME" \
    --template-file "$TEMPLATE_FILE" \
    --capabilities CAPABILITY_NAMED_IAM CAPABILITY_IAM \
    --region "$REGION"

if [ $? -eq 0 ]; then
    echo "Deployment successful!"
    
    # Get the CloudFront Domain Name
    CLOUDFRONT_DOMAIN=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDomainName'].OutputValue" \
        --output text \
        --region "$REGION")
        
    # Get the Elastic Beanstalk Environment URL
    EB_URL=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --query "Stacks[0].Outputs[?OutputKey=='EnvironmentURL'].OutputValue" \
        --output text \
        --region "$REGION")
        
    # Get the RDS Endpoint
    RDS_ENDPOINT=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --query "Stacks[0].Outputs[?OutputKey=='RDSEndpoint'].OutputValue" \
        --output text \
        --region "$REGION")
    
    echo "--------------------------------------------------"
    echo "CloudFront URL: https://$CLOUDFRONT_DOMAIN"
    echo "S3 Sync Command: aws s3 sync dist/phc-web/browser s3://bharat-care-link/web/dev --delete"
    echo "Elastic Beanstalk Backend URL: http://$EB_URL"
    echo "RDS MySQL Endpoint: $RDS_ENDPOINT:3306"
    echo "--------------------------------------------------"
else
    echo "Deployment failed."
    exit 1
fi
