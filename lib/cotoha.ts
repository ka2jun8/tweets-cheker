import axios from "axios";

const COTOHA_AUTH_ENDPOINT = "https://api.ce-cotoha.com/v1/oauth/accesstokens";
const COTOHA_ENDPOINT = "https://api.ce-cotoha.com/api/dev/nlp/v1/";

export type Sentiment = "Positive" | "Negative" | "Neutral";

interface CotohaResult {
  result: {
    sentiment: Sentiment;
    score: number;
    emotinal_phrase: object[];
  };
  status: 0 | 1;
  message: string;
};

export default class Cotoha {
  clientId: string;
  clientSecret: string;
  initialized: boolean = false;
  bearerToken: string;
  authTokenInterval: number;

  constructor({client_id, client_secret}) {
    this.clientId = client_id;
    this.clientSecret = client_secret;
  }

  async initialize() {
    try {
      await this.authenticate();
      this.authTokenInterval = setInterval(this.authenticate, 36000);
      this.initialized = true;
      console.log("initialized success.");
      return;
    } catch(e) {
      console.error("initialize:", e);
    }
  }

  async authenticate() {
    if(this.clientId && this.clientSecret) {
      try {
        const res = await axios.post(COTOHA_AUTH_ENDPOINT, {
          grantType: "client_credentials",
          clientId: this.clientId,
          clientSecret: this.clientSecret,
        });
        this.bearerToken = res.data.access_token;
      } catch(e) {
        console.error("authenticate:", e);
        throw e;
      }
    }
  }

  async sentiment(statement: string): Promise<CotohaResult> {
    if(!this.initialized) {
      throw new Error("Uninitialzed. Did you called initialize()?");
    }
    if(!statement) {
      return { status: 1 } as CotohaResult;
    }
    try {
      const res = await axios.post<CotohaResult>(`${COTOHA_ENDPOINT}sentiment`, {
        sentence: statement,
      }, {
        headers: {
          Authorization: "Bearer " + this.bearerToken,
        }
      });
      return res.data;
    } catch(e) {
      console.error("sentiment:", e);
      throw e;
    }
  }

  finalize() {
    clearInterval(this.authTokenInterval);
  }
}
