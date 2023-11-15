import mysql from "mysql";

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_SCHEMA,
});
export const lambdaHandler = async (event, context) => {
  try {
    const promise = new Promise((resolve, reject) => {
      connection.query("SELECT * FROM operations", (err, result, values) => {
        if (!err) {
          resolve(result);
        } else {
          console.log("Error executing query: " + err.message);
          reject(err);
        }
      });
    });

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        data: await promise,
      }),
      isBase64Encoded: false,
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: "Operations call failed",
      isBase64Encoded: false,
    };
  }
};
