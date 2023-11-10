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
      connection.query(event.query, (err, result, values) => {
        if (!err) {
          connection.end();
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
    };
  } catch (err) {
    console.log(err);
    return err;
  }
};
