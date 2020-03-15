import next from "next"
import Koa from "koa";
import Router from "koa-router";
import KoaBody from "koa-body";
import Twitter from "./twit"
import Cotoha from "./cotoha";
import tweets from "./handlers/tweets";

require("dotenv").config()

const port = parseInt(process.env.PORT, 10) || 3000
const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(async () => {
  const twit = await initializeTwit();
  const cotoha = await initializeCotoha();
  const server = new Koa();
  const router = new Router();

  process.on("exit", () => {
    cotoha.finalize();
  });

  server.use(KoaBody());

  router.get("/tweets", tweets(twit, cotoha));

  router.all("*", async ctx => {
    await handle(ctx.req, ctx.res);
    ctx.respond = false;
  });

  server.use(async (ctx, next) => {
    ctx.res.statusCode = 200;
    await next();
  });

  server.use(router.routes());

  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`)
  });
});

async function initializeCotoha() {
  const cotoha = new Cotoha();
  await cotoha.initialize();
  return cotoha;
}

async function initializeTwit() {
  return new Twitter();
}
