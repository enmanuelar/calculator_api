import axios from "axios";
import AWS from "aws-sdk";

const egressLambda = await new AWS.Lambda();

export async function getUserIdFromAuth0(authorizationToken) {
  const userInfo = await axios.get(`${process.env.TOKEN_ISSUER}userinfo`, {
    headers: {
      Authorization: authorizationToken,
      Accept: "application/json",
    },
  });

  return userInfo.data.sub;
}

export async function invokeDB(query) {
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

export const getRecordsByUserId = async (userId, page = 0, limit = 10) => {
  const offset = Number(page) * Number(limit);
  const query = `SELECT r.id as id, user_id as userId, user_balance as balance, operation_result as result, date, amount as cost, type as operationType  FROM records r JOIN operations o on o.id = r.operation_id WHERE user_id="${userId}" AND deleted_at IS NULL LIMIT ${limit} OFFSET ${offset}`;
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
