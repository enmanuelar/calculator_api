# calculator_api

This project contains source code and supporting files for the API for the TrueNorth's arithmetic project exercise. It includes the following files and folders.

- records - Code for the /records endpoint Lambda function handlers.
- auth-authorizer - Code for the custom authorizer lambda for the API Gateway.
- db-proxy - Code for the lambda to interact with an RDS Proxy service in the VPC.
- events - Invocation events that you can use to invoke the function.
- records/tests - Unit tests for the records code. 
- template.yaml - A template that defines the application's AWS resources.

## Building and running the project
This project is using SAM, to build it run:
```bash
calculator_api$ sam build
```
SAM doesn't support custom authorization, because of this you won't be able to run a local server, but you can run individual lambdas using:
```bash
calculator_api$ sam local invoke [LambdaFunction] -n events/mockEnv.json --event [eventFile.json] --profile [profile]
```
- LambdaFunction is the name of the function defined in `template.yaml`.
- The credentials for `--profile` will be provided privately.
- Replace `eventFile.json` with the event you want to use that is located in the events directory.

## Unit tests
Tests are defined in the `records/tests` folder in this project. Use NPM to install the [Mocha test framework](https://mochajs.org/) and run unit tests.

```bash
calculator_api$ cd records
records$ npm install
records$ npm run test
```
