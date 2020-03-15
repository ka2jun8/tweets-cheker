import {Context} from "koa";
import Twitter from "../twit";
import Cotoha from "../cotoha";
import isBefore from "date-fns/isBefore"
import addHours from "date-fns/addHours"

interface RequestQuery {
  q: string;
}

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

const weakTweets: {[keyword: string]: ResponseBody} = {};

export default function tweets(twit: Twitter, cotoha: Cotoha) {
  return async (ctx: Context) => {
    try {
      const { q }: RequestQuery = ctx.query;
      const now = new Date();
      if(weakTweets[q] && isBefore(now, addHours(weakTweets[q].updatedAt, 12))) {
        ctx.res.statusCode = 200;
        ctx.body = weakTweets[q];
        return;
      }

      const statuses = await twit.search(q);
  
      const requests = statuses.map(s => cotoha.sentiment(s.text));
  
      const sentiments = await Promise.all(requests);

      ctx.res.statusCode = 200;

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
      ctx.body = response;
    } catch(e) {
      console.error("tweets:", e);
      throw e;
    }
  }
}