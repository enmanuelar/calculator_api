import { CognitoJwtVerifier } from "aws-jwt-verify";
import { v4 as uuidv4 } from "uuid";
function getAccessTokenFromCookies(cookie) {
  const cookieArr = cookie.split("accessToken=");
  if (cookieArr[1] != null) {
    return cookieArr[1];
  }
  return null;
}

const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.USER_POOL_ID,
  tokenUse: "id",
  clientId: process.env.USER_POOL_CLIENT_ID,
});

function generate_policy(principal_id, effect, resource) {
  return {
    principalId: principal_id,
    policyDocument: {
      Version: "2012-10-17",
      Statement: [
        {
          Action: "execute-api:Invoke",
          Effect: effect,
          Resource: resource,
        },
      ],
    },
  };
}

export const lambdaHandler = async (event, context) => {
  const { methodArn } = event;
  const principalId = uuidv4();
  try {
    if (!event.headers.Cookie) {
      console.log("No cookies found");
      return generate_policy(principalId, "DENY", methodArn);
    }
    const accessToken = getAccessTokenFromCookies(event.headers.Cookie);
    if (!accessToken) {
      console.log("Access token not found in cookies");
      return generate_policy(principalId, "DENY", methodArn);
    }
    await verifier.verify(accessToken);
    return generate_policy(principalId, "ALLOW", methodArn);
  } catch (err) {
    console.error(err);
    return generate_policy(principalId, "DENY", methodArn);
  }
};
