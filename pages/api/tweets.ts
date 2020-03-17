import { NowRequest, NowResponse } from "@now/node";
import Twitter from "../../lib/twit";
import Cotoha from "../../lib/cotoha";
import isBefore from "date-fns/isBefore"
import addHours from "date-fns/addHours"

type ResponseMessage = {
  id: number;
  createdAt: string;
  text?: string;
  user: {
    name: string;
    screenName: string;
    profileImageUrl: string;
  };
};

type ResponseBody = {
  size: number;
  contents: {
    [senti: string]: ResponseMessage[]
  };
  updatedAt: Date;
};

let cotoha: Cotoha = null;
let twit: Twitter = null;
const weakTweets: {[keyword: string]: ResponseBody} = {};

export default async (req: NowRequest, res: NowResponse) => {
  const query = req.query;
  const q = query.q as string;

  const now = new Date();
  if(weakTweets[q] && isBefore(now, addHours(weakTweets[q].updatedAt, 12))) {
    res.statusCode = 200;
    return res.json(weakTweets[q]);
  }

  if(!q) {
    return res.json({size: 0, contents: [], updatedAt: now});
  }

  const {
    consumer_key,
    consumer_secret,
    access_token,
    access_token_secret,
    client_id,
    client_secret,
  } = process.env;

  try {
    if(!cotoha) {
      console.log("create cotoha instance");
      cotoha = new Cotoha({ client_id, client_secret });
      await cotoha.initialize();
    }
  
    if(!twit) {
      console.log("create twit instance");
      twit = new Twitter({
        consumer_key,
        consumer_secret,
        access_token,
        access_token_secret,
      });
    }
  
    const statuses = await twit.search(q);

    const requests = statuses.map(s => cotoha.sentiment(s.text));

    const sentiments = await Promise.all(requests);

    res.statusCode = 200;

    const response: ResponseBody = {
      size: statuses.length,
      contents: {},
      updatedAt: now,
    };
    sentiments.forEach((senti, i) => {
      const status = statuses[i];
      const { sentiment } = senti.result;
      if(!response.contents[sentiment]){
        response.contents[sentiment] = [];
      }
      response.contents[sentiment].push({
        id: status.id,
        createdAt: status.created_at,
        text: status.text,
        user: {
          name: status.user.name,
          screenName: status.user.screen_name,
          profileImageUrl: status.user.profile_image_url,
        },
      });
    });
    weakTweets[q] = response;
    res.json(response);
  } catch(e) {
    console.error("tweets:", e);
    throw e;
  }
}
