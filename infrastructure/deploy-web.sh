#!/bin/bash

# Configuration
WEB_DIR="../phc-web"
S3_BUCKET="s3://bharat-care-link/web/dev"
DIST_DIR="dist/phc-web/browser"
DISTRIBUTION_ID="ERC6CW11VIC9X"
REGION="ap-south-1"

# Move to web directory
cd "$WEB_DIR" || { echo "Web directory not found at $WEB_DIR"; exit 1; }

echo "Step 1: Installing dependencies..."
npm install

echo "Step 2: Building the application for production..."
npm run build:prod

if [ $? -ne 0 ]; then
    echo "Build failed. Exiting."
    exit 1
fi

echo "Step 3: Syncing files to S3 bucket: $S3_BUCKET..."
aws s3 sync "$DIST_DIR" "$S3_BUCKET" --delete --region "$REGION"

if [ $? -eq 0 ]; then
    echo "Sync successful!"
    
    echo "Step 4: Invalidating CloudFront cache..."
    aws cloudfront create-invalidation --distribution-id "$DISTRIBUTION_ID" --paths "/*" --region "$REGION"
    
    echo "--------------------------------------------------"
    echo "Deployment complete!"
    echo "Web app is live at: https://d3mbee4y95wucd.cloudfront.net"
    echo "--------------------------------------------------"
else
    echo "S3 sync failed."
    exit 1
fi
