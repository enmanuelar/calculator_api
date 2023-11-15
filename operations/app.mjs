import mysql from "mysql";
import axios from "axios";

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_SCHEMA,
});

function getOperations() {
  return new Promise((resolve, reject) => {
    connection.query("SELECT * FROM operations", (err, result, values) => {
      if (!err) {
        resolve(result);
      } else {
        console.log("Error executing query: " + err.message);
        reject(err);
      }
    });
  });
}

function getUserBalance(userId) {
  return new Promise((resolve, reject) => {
    connection.query(
      `SELECT user_balance FROM records WHERE user_id="${userId}" AND deleted_at IS NULL ORDER BY date DESC LIMIT 1`,
      (err, result, values) => {
        if (!err) {
          resolve(result);
        } else {
          console.log("Error executing query: " + err.message);
          reject(err);
        }
      },
    );
  });
}

export async function getUserIdFromAuth0(authorizationToken) {
  const userInfo = await axios.get(`${process.env.TOKEN_ISSUER}userinfo`, {
    headers: {
      Authorization: authorizationToken,
      Accept: "application/json",
    },
  });

  return userInfo.data.sub;
}

export const lambdaHandler = async (event, context) => {
  try {
    const authorizationToken =
      event.headers?.Authorization || event.headers?.authorization;
    const userId = await getUserIdFromAuth0(authorizationToken);
    console.log("Retrieved userId", userId);
    const operations = await getOperations();
    const userBalance = await getUserBalance(userId);
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        data: {
          operations,
          userBalance,
        },
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
