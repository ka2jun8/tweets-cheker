import Twit from "twit";

export default class Twitter {
  initialized: boolean;
  T: Twit

  constructor() {
    this.initialize();
  }

  private async initialize() {
    console.log("Twit initialize", process.env.consumer_key);
    if(process.env.consumer_key) {
      this.T = new Twit({
        consumer_key: process.env.consumer_key,
        consumer_secret: process.env.consumer_secret,
        access_token: process.env.access_token,
        access_token_secret: process.env.access_token_secret,
        timeout_ms: 60*1000,
        strictSSL: true,
      });
      this.initialized = true;
    }
  }

  async search(keyword: string): Promise<Twit.Twitter.Status[]> {
    if(!this.initialized) {
      throw new Error("Uninitialzed. Did you called initialize()?");
    }
    if(!keyword) {
      return [];
    }
    try {
      const res = await this.T.get('search/tweets', { q: `${keyword}  since:2011-07-11`, count: 30 });
      const { statuses } = res.data as Twit.Twitter.SearchResults;
      return statuses;
    } catch(e) {
      console.error("search:", e);
      throw e;
    }
  }
}
