require("dotenv").config()

module.exports = {
  env: {
    consumer_key: process.env.consumer_key,
    consumer_secret: process.env.consumer_secret,
    access_token: process.env.access_token,
    access_token_secret: process.env.access_token_secret,
    client_id: process.env.client_id,
    client_secret: process.env.client_secret,
  },
  publicRuntimeConfig: {
    APP_ENDPOINT: process.env.APP_ENDPOINT || "http://localhost:3000/api",
  },
};
