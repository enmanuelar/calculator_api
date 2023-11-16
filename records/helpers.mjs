import axios from "axios";
import AWS from "aws-sdk";

const egressLambda = await new AWS.Lambda();
const dynamoDBClient = new AWS.DynamoDB.DocumentClient({ region: "us-east-1" });

export async function getUserIdFromAuth0(authorizationToken) {
  const tableName = "UserInfoCache";
  const itemKey = authorizationToken.split(" ")[1];
  const dynamoDBRequest = {
    TableName: tableName,
    Key: {
      authorizationToken: itemKey,
    },
  };

  const cachedUser = await dynamoDBClient.get(dynamoDBRequest).promise();
  if (Object.keys(cachedUser).length === 0) {
    const userInfo = await axios.get(`${process.env.TOKEN_ISSUER}userinfo`, {
      headers: {
        Authorization: authorizationToken,
        Accept: "application/json",
      },
    });

    const userId = userInfo.data.sub;

    await dynamoDBClient
      .put({
        TableName: tableName,
        Item: {
          authorizationToken: itemKey,
          userId: userId,
        },
      })
      .promise();

    return userId;
  }

  return cachedUser.Item.userId;
}

export async function invokeDB(query) {
  const params = {
    FunctionName:
      "arn:aws:lambda:us-east-1:900468521202:function:calculator-api-DBProxyFunction-VoE1HHhHs87C",
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

export const getRecordsByUserId = async (
  userId,
  page = 0,
  limit = 10,
  orderBy = "date",
  direction = "asc",
) => {
  const offset = Number(page) * Number(limit);
  const query = `SELECT r.id as id, user_id as userId, user_balance as balance, operation_result as result, date, amount as cost, type as operationType  FROM records r JOIN operations o on o.id = r.operation_id WHERE user_id="${userId}" AND deleted_at IS NULL ORDER BY ${orderBy} ${direction} LIMIT ${limit} OFFSET ${offset}`;
  const response = await invokeDB(query);
  return JSON.parse(response.body).data;
};

export const getTotalRecordsCountByUserId = async (userId) => {
  const query = `SELECT COUNT(id) AS total_count FROM records WHERE user_id="${userId}" AND deleted_at IS NULL`;
  const response = await invokeDB(query);
  return JSON.parse(response.body).data;
};

export const deleteRecordById = async (userId, recordId) => {
  const query = `UPDATE records SET deleted_at=CURTIME() WHERE user_id="${userId}" AND id="${recordId}"`;
  const response = await invokeDB(query);
  return JSON.parse(response.body).data;
};

export const getOperationById = async (operationId) => {
  const query = `SELECT * FROM operations where id=${operationId}`;
  const response = await invokeDB(query);
  return JSON.parse(response.body).data;
};

export const getUserBalance = async (userId) => {
  const query = `SELECT user_balance FROM records WHERE user_id="${userId}" AND deleted_at IS NULL ORDER BY date DESC LIMIT 1`;
  const response = await invokeDB(query);
  return JSON.parse(response.body).data;
};

export const insertRecord = async (record) => {
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

export const getOperations = async () => {
  const query = "SELECT * FROM operations";
  const response = await invokeDB(query);
  return JSON.parse(response.body).data;
};

export const insertNewUserInitialRecord = async (userId, initialCredits) => {
  const query = `INSERT INTO records (id, user_id, user_balance, date) SELECT UUID(), "${userId}", ${initialCredits}, CURTIME() FROM dual WHERE NOT EXISTS (SELECT id FROM records WHERE user_id="${userId}")`;
  const response = await invokeDB(query);
  return JSON.parse(response.body).data;
};

export const performOperation = async (
  firstValue,
  secondValue,
  operationType,
) => {
  function formatResult(compute) {
    return compute().toFixed(2).toString();
  }
  switch (operationType) {
    case "addition":
      return formatResult(() => firstValue + secondValue);
    case "subtraction":
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

export function formatDateToMySQLDateTime(date) {
  return date.toISOString().slice(0, 19).replace("T", " ");
}
