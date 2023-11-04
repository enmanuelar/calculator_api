import { authenticate, generatePolicy } from "./helpers.mjs";

export const lambdaHandler = async (event, context) => {
  const { methodArn } = event;
  try {
    return await authenticate(event);
  } catch (err) {
    console.error(err);
    return generatePolicy("DENY", methodArn);
  }
};
