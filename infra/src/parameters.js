module.exports = {
    ProjectName: {
        Type: 'String',
        Default: 'ai-bharat-care-link',
        Description: 'Project name for resource naming'
    },
    Environment: {
        Type: 'String',
        Default: 'dev',
        AllowedValues: ['dev', 'prod'],
        Description: 'Deployment environment'
    }
};
