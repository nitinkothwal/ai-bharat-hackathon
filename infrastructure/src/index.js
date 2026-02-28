module.exports = {
    AWSTemplateFormatVersion: '2010-09-09',
    Description: 'Bharat CareLink Consolidated Infrastructure Template (S3, CloudFront, IAM, Elastic Beanstalk, RDS)',
    Parameters: require('./parameters'),
    Resources: {
        ...require('./s3-cloudfront'),
        ...require('./iam-roles'),
        ...require('./elastic-beanstalk'),
        ...require('./rds-mysql')
    },
    Outputs: require('./outputs')
};
