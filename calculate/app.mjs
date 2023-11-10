import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import AWS from "aws-sdk";

const egressLambda = await new AWS.Lambda();

async function invokeDB(query) {
  const params = {
    FunctionName:
      "arn:aws:lambda:us-east-1:900468521202:function:calculator-api-DBProxyFunction-B1U3tSy9QBTi",
    InvocationType: "RequestResponse",
    Payload: JSON.stringify({
      query,
    }),
  };
  const egressResponse = await egressLambda.invoke(params).promise();
  if (egressResponse.StatusCode !== 200) {
    throw new Error("Error invoking lambda");
  }
  return JSON.parse(egressResponse.Payload.toString());
}

const getOperationById = async (operationId) => {
  const query = `SELECT * FROM operations where id=${operationId}`;
  const response = await invokeDB(query);
  return JSON.parse(response.body).data;
};

const getUserBalance = async (userId) => {
  const query = `SELECT user_balance FROM records WHERE user_id="${userId}" AND deleted_at IS NULL ORDER BY date DESC LIMIT 1`;
  const response = await invokeDB(query);
  return JSON.parse(response.body).data;
};

const insertRecord = async (record) => {
  const {
    id,
    operationId,
    userId,
    userBalance,
    operationResult,
    date,
    amount,
  } = record;
  const query = `INSERT INTO records (id, operation_id, user_id, user_balance, operation_result, date, amount) VALUES ("${id}", ${operationId}, "${userId}", ${userBalance}, "${operationResult}", "${date}", "${amount}")`;
  const response = await invokeDB(query);
  return JSON.parse(response.body).data;
};

const insertNewUserInitialRecord = async (userId, initialCredits) => {
  const query = `INSERT INTO records (id, user_id, user_balance, date) SELECT UUID(), "${userId}", ${initialCredits}, CURTIME() FROM dual WHERE NOT EXISTS (SELECT id FROM records WHERE user_id="${userId}")`;
  const response = await invokeDB(query);
  return JSON.parse(response.body).data;
};

const performOperation = async (firstValue, secondValue, operationType) => {
  function formatResult(compute) {
    return compute().toFixed(2).toString();
  }
  switch (operationType) {
    case "addition":
      return formatResult(() => firstValue + secondValue);
    case "substraction":
      return formatResult(() => firstValue - secondValue);
    case "multiplication":
      return formatResult(() => firstValue * secondValue);
    case "division":
      return formatResult(() => firstValue / secondValue);
    case "square_root":
      return formatResult(() => Math.sqrt(firstValue));
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

async function getUserIdFromAuth0(authorizationToken) {
  const userInfo = await axios.get(`${process.env.TOKEN_ISSUER}userinfo`, {
    headers: {
      Authorization: authorizationToken,
      Accept: "application/json",
    },
  });

  return userInfo.data.sub;
}

export const lambdaHandler = async (event, context) => {
  console.log("INITIATING LAMBDA EXECUTION");
  try {
    const { operationId, firstValue, secondValue } = JSON.parse(event.body);
    const authorizationToken =
      event.headers?.Authorization || event.headers?.authorization;
    const userId = await getUserIdFromAuth0(authorizationToken);
    console.log("UserId", userId);

    const insertedInitialRecord = await insertNewUserInitialRecord(userId, 300);
    console.log("insertedUser", insertedInitialRecord);
    const operation = await getOperationById(operationId);
    console.log("Retrieved operation: ", operation);
    //Get user balance
    const balance = await getUserBalance(userId);
    console.log("User balance: ", balance);

    //Perform operation
    if (operation[0].cost >= balance[0].user_balance) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
        body: "Not enough credits to perform operation",
        isBase64Encoded: false,
      };
    }

    const operationResult = await performOperation(
      Number(firstValue),
      Number(secondValue),
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

    console.log("Returning successful response", newRecord);
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        data: newRecord,
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
      body: JSON.stringify({
        message: err.message,
      }),
      isBase64Encoded: false,
    };
  }
};
