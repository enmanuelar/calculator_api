import { v4 as uuidv4 } from "uuid";
import {
  deleteRecordById,
  formatDateToMySQLDateTime,
  getOperationById,
  getOperations,
  getRecordsByUserId,
  getTotalRecordsCountByUserId,
  getUserBalance,
  getUserIdFromAuth0,
  insertNewUserInitialRecord,
  insertRecord,
  performOperation,
} from "./helpers.mjs";

function response(data, statusCode) {
  return {
    statusCode: statusCode,
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify({
      data,
    }),
    isBase64Encoded: false,
  };
}

export const getRecordsHandler = async (event, context) => {
  try {
    console.log("Initiating Records function");
    const { page, limit, orderBy, direction } = event.queryStringParameters;
    const authorizationToken =
      event.headers?.Authorization || event.headers?.authorization;
    const userId = await getUserIdFromAuth0(authorizationToken);
    console.log("Retrieved userId", userId);
    const records = await getRecordsByUserId(
      userId,
      page,
      limit,
      orderBy,
      direction,
    );
    console.log(
      `Retrieved records for page ${page}, limit ${limit}, order ${orderBy}, direction ${direction}`,
    );

    const count = await getTotalRecordsCountByUserId(userId);
    console.log("Retrieved total records count", count);

    return response({ count, records }, 200);
  } catch (err) {
    console.error(err);
    return response(
      {
        message: err.message,
      },
      500,
    );
  }
};

export const createRecordsHandler = async (event, context) => {
  console.log("INITIATING LAMBDA EXECUTION");
  try {
    const { operationId, firstValue, secondValue } = JSON.parse(event.body);
    const authorizationToken =
      event.headers?.Authorization || event.headers?.authorization;
    const userId = await getUserIdFromAuth0(authorizationToken);
    console.log("UserId", userId);
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
    return response({ data: newRecord }, 200);
  } catch (err) {
    console.error(err);
    return response(
      {
        message: err.message,
      },
      500,
    );
  }
};

export const deleteRecordsHandler = async (event, context) => {
  try {
    console.log("Initiating Delete Records function");
    const { recordId } = event.pathParameters;
    console.log("Received recordId:", recordId);
    const authorizationToken =
      event.headers?.Authorization || event.headers?.authorization;
    const userId = await getUserIdFromAuth0(authorizationToken);
    console.log("Retrieved userId", userId);
    const result = await deleteRecordById(userId, recordId);
    console.log(`Deleted record with id ${recordId}`, result);
    return response(
      {
        message: "Success",
      },
      200,
    );
  } catch (err) {
    console.error(err);
    return response(
      {
        message: err.message,
      },
      500,
    );
  }
};

export const getLastRecordHandler = async (event, context) => {
  try {
    const authorizationToken =
      event.headers?.Authorization || event.headers?.authorization;
    const userId = await getUserIdFromAuth0(authorizationToken);
    console.log("Retrieved userId", userId);
    //Inserts an initial user record if it doesn't exist in the db
    const insertedInitialRecord = await insertNewUserInitialRecord(userId, 300);
    console.log("insertedUser", insertedInitialRecord);
    const operations = await getOperations();
    console.log("Retrieved operations", operations);
    const userBalance = await getUserBalance(userId);
    console.log("Retrieved userBalance", userBalance);
    return response({ operations, userBalance }, 200);
  } catch (err) {
    console.error(err);
    return response(
      {
        message: err.message,
      },
      500,
    );
  }
};
