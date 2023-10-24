import axios from "axios";
import qs from "qs";
export const lambdaHandler = async (event, context) => {
  try {
    const code = event.queryStringParameters?.code;
    if (!code) {
      return {
        statusCode: 400,
        body: "Missing code query param",
      };
    }
    const data = {
      grant_type: "authorization_code",
      client_id: process.env.USER_POOL_CLIENT_ID, //TODO: get this clientId from SSM
      redirect_uri: encodeURI(
        "https://lmmn3rstgj.execute-api.us-east-1.amazonaws.com/api/auth/callback",
      ),
      code: code,
    };
    const res = await axios.post(
      "https://enmanuel-calculator-app.auth.us-east-1.amazoncognito.com/oauth2/token",
      qs.stringify(data),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
    );
    return {
      statusCode: 302,
      headers: {
        Location: "/api",
        "Set-Cookie": `accessToken=${res.data.id_token}; Secure; HttpOnly; SameSite=Lax; Path=/api`,
      },
    };
  } catch (err) {
    console.error(err);
    return err;
  }
};
