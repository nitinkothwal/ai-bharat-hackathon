#!/bin/bash
APP_NAME="ai-bharat-api"
ENV_NAME="ai-bharat-api-env"
REGION="ap-south-1"
S3_BUCKET="bharat-care-link"
VERSION_LABEL="v-$(date +%Y%m%d%H%M%S)"
DIST_DIR="dist"
ZIP_FILE="$DIST_DIR/server-deploy.zip"

echo "Deploying server version: $VERSION_LABEL"

# Ensure dist directory exists
mkdir -p "$DIST_DIR"

# 1. Build the application (TypeScript to JS)
echo "Building server application..."
cd ../server
npm install
npm run build

# 2. Package the application
echo "Packaging application..."
# Include only the compiled JS, package files, and deployment config
zip -r ../infrastructure/$ZIP_FILE dist package.json package-lock.json Procfile
cd ../infrastructure

# 3. Upload to S3
echo "Uploading to S3..."
aws s3 cp $ZIP_FILE s3://$S3_BUCKET/deployments/$(basename $ZIP_FILE) --region $REGION

# 4. Create Application Version
echo "Creating Elastic Beanstalk application version..."
aws elasticbeanstalk create-application-version \
    --application-name "$APP_NAME" \
    --version-label "$VERSION_LABEL" \
    --source-bundle S3Bucket="$S3_BUCKET",S3Key="deployments/$(basename $ZIP_FILE)" \
    --region "$REGION"

# 5. Update Environment
echo "Updating Elastic Beanstalk environment..."
aws elasticbeanstalk update-environment \
    --environment-name "$ENV_NAME" \
    --version-label "$VERSION_LABEL" \
    --region "$REGION"

if [ $? -eq 0 ]; then
    echo "Deployment initiated successfully!"
    echo "Check the environment status at: https://$REGION.console.aws.amazon.com/elasticbeanstalk/home?region=$REGION#/environment/dashboard?environmentId=$ENV_NAME"
else
    echo "Deployment failed."
    exit 1
fi
