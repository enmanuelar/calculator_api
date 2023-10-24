// import mysql from 'mysql'
//
// const connection = mysql.createConnection({
//     host     : '127.0.0.1',
//     user     : 'root',
//     password : 'password',
//     database : 'calculator_api'
// });

/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Context doc: https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html
 * @param {Object} context
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 *
 */

export const lambdaHandler = async (event, context) => {
  try {
    // connection.connect();
    //
    // connection.query('SELECT 1 + 1 AS solution', function (error, results, fields) {
    //     if (error) throw error;
    //     console.log('The solution is: ', results[0].solution);
    // });
    //
    // connection.end();
    return {
      'statusCode': 200,
      'body': JSON.stringify({
        message: 'hello world WITH AUTH',
      })
    }
  } catch (err) {
    console.log(err);
    return err;
  }
};

export const noAuthHandler = async (event, context) => {
  try {
    return {
      'statusCode': 200,
      'body': JSON.stringify({
        message: 'hello world NO AUTH',
      })
    }
  } catch (err) {
    console.log(err);
    return err;
  }
}