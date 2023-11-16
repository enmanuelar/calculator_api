# calculator_api

This project contains source code and supporting files for a serverless application that you can deploy with the SAM CLI. It includes the following files and folders.

- records - Code for the /records endpoint Lambda function handlers.
- auth-authorizer - Code for the custom authorizer lambda for the API Gateway.
- db-proxy - Code for the lambda to interact with an RDS Proxy service in the VPC.
- events - Invocation events that you can use to invoke the function.
- records/tests - Unit tests for the records code. 
- template.yaml - A template that defines the application's AWS resources.

## Unit tests

Tests are defined in the `records/tests` folder in this project. Use NPM to install the [Mocha test framework](https://mochajs.org/) and run unit tests.

```bash
calculator_api$ cd records
hello-world$ npm install
hello-world$ npm run test
```

## Resources

See the [AWS SAM developer guide](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/what-is-sam.html) for an introduction to SAM specification, the SAM CLI, and serverless application concepts.

Next, you can use AWS Serverless Application Repository to deploy ready to use Apps that go beyond hello world samples and learn how authors developed their applications: [AWS Serverless Application Repository main page](https://aws.amazon.com/serverless/serverlessrepo/)
