import {
  deleteRecordById,
  getRecordsByUserId,
  getTotalRecordsCountByUserId,
  getUserIdFromAuth0,
} from "./helpers.mjs";

export const lambdaHandler = async (event, context) => {
  try {
    console.log("Initiating Records function");
    const { page, limit } = event.queryStringParameters;
    const authorizationToken =
      event.headers?.Authorization || event.headers?.authorization;
    const userId = await getUserIdFromAuth0(authorizationToken);
    console.log("Retrieved userId", userId);
    const records = await getRecordsByUserId(userId, page, limit);
    console.log(`Retrieved records for page ${page} and limit ${limit}`);

    const count = await getTotalRecordsCountByUserId(userId);
    console.log("Retrieved total records count", count);

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        data: {
          count,
          records,
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
      body: JSON.stringify({
        message: err.message,
      }),
      isBase64Encoded: false,
    };
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

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        data: {
          message: "Success",
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
      body: JSON.stringify({
        message: err.message,
      }),
      isBase64Encoded: false,
    };
  }
};
