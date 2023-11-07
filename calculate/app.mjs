import mysql from "mysql";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_SCHEMA,
});

const getOperationById = (operationId) => {
  return new Promise((resolve, reject) => {
    connection.query(
      `SELECT * FROM operations where id=${operationId}`,
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
};

const getUserBalance = (userId) => {
  return new Promise((resolve, reject) => {
    connection.query(
      `SELECT user_balance FROM records WHERE user_id="${userId}" ORDER BY "date" DESC LIMIT 1`,
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
};

const insertRecord = (record) => {
  const {
    id,
    operationId,
    userId,
    userBalance,
    operationResult,
    date,
    amount,
  } = record;
  return new Promise((resolve, reject) => {
    connection.query(
      `INSERT INTO records (id, operation_id, user_id, user_balance, operation_result, date, amount) VALUES ("${id}", ${operationId}, "${userId}", ${userBalance}, "${operationResult}", "${date}", "${amount}")`,
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
};

const performOperation = async (firstValue, secondValue, operationType) => {
  switch (operationType) {
    case "addition":
      return firstValue + secondValue;
    case "substraction":
      return firstValue - secondValue;
    case "multiplication":
      return firstValue * secondValue;
    case "division":
      return firstValue / secondValue;
    case "square_root":
      return Math.sqrt(firstValue);
    case "random_string":
      try {
        const stringGeneratorReq = {
          jsonrpc: "2.0",
          method: "generateStrings",
          params: {
            apiKey: process.env.STRING_GENERATOR_API_KEY,
            n: 1,
            length: 10,
            characters: "abcdefghijklmnopqrstuvwxyz",
            replacement: true,
          },
          id: 112233,
        };
        const response = await axios.post(
          process.env.STRING_GENERATOR_URL,
          stringGeneratorReq,
        );
        return response.data.result.random.data.pop();
      } catch (err) {
        throw err;
      }
    default:
      return 0;
  }
};

function formatDateToMySQLDateTime(date) {
  return date.toISOString().slice(0, 19).replace("T", " ");
}

export const lambdaHandler = async (event, context) => {
  try {
    const { operationId, firstValue, secondValue, headers } = event;
    //Get userInfo from Auth0 from authorization header
    const userInfo = await axios.get(`${process.env.TOKEN_ISSUER}userinfo`, {
      headers: {
        Authorization: headers.authorization,
        Accept: "application/json",
      },
    });

    const userId = userInfo.data.sub;
    //Get the operation by id
    const operation = await getOperationById(operationId);
    console.log("Retrieved operation: ", operation);
    //Get user balance
    const balance = await getUserBalance(userId);
    console.log("User balance: ", balance);

    //Perform operation
    if (operation[0].cost >= balance[0].user_balance) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Not enough credits to perform operation",
        }),
      };
    }

    const operationResult = await performOperation(
      firstValue,
      secondValue,
      operation[0].type,
    );
    const userBalance = balance[0].user_balance - operation[0].cost;

    //Save operation to DB in the Record table
    const newRecord = {
      id: uuidv4(),
      operationId,
      userId,
      userBalance,
      operationResult,
      date: formatDateToMySQLDateTime(new Date()),
      amount: operation[0].cost,
    };
    await insertRecord(newRecord);
    connection.end();

    return {
      statusCode: 200,
      body: JSON.stringify({
        data: newRecord,
      }),
    };
  } catch (err) {
    console.log(err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: err.message,
      }),
    };
  }
};
