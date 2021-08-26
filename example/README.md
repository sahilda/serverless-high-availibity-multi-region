# Example Multiregion Serverless function

This directory contains a sample serverless function that can be deployed with minimal configuration. Similar to the parent directory,
there are some AWS resources which need to be configured, including:

1. A hosted zone needs to be created in Route 53.
2. A certficate needs to exist in both regions in Certificate Manager that covers the domain name.

With this, we can then update `serverless.yml` with the necessary configuration.

## Deployment

With the `serverless.yml` updated, we are ready to deploy onto two regions. We can run the following:

```{bash}
serverless deploy --region us-west-1 --stage development
serverless deploy --region us-east-1 --stage development
```

This will now fully configure the service with high-availability in two regions, us-west-1 and us-east-1 with failover based on the health check endpoint. Services to check in
AWS to see how it's configured would be:

1. Cloudformation for the service
2. Lambda for the serverless function
3. API Gateway for the apis and custom domain name
4. Route 53 for the healthchecks and failover A records
