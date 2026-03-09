# Deploy your MCP server to AWS

## Install deployment tools

Install the AgentCore starter toolkit:


```bash
pip install bedrock-agentcore-starter-toolkit
```

## Configure your MCP server for deployment

Before configuring your deployment, you need to set up a Cognito user pool for authentication as described in Set up Cognito user pool for authentication. This provides the OAuth tokens required for secure access to your deployed server.


After setting up authentication, create the deployment configuration:

```bash
agentcore configure -e main.py --protocol MCP
```

## Deploy to AWS

Deploy your agent:

```bash
agentcore launch
```
