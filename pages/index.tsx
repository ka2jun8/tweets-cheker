import { NextPageContext } from "next";
import Head from "next/head"
import axios from "axios";
import styled from "styled-components";
import { useState, useCallback } from "react";
import getConfig from "next/config";
import fetch from "isomorphic-unfetch";

type Props = {
  size: number;
  contents: {
    [senti: string]: {
      id: number;
      createdAt: string;
      text?: string;
      user: {
        name: string;
        screenName: string;
        profileImageUrl: string;
      };
    }[];
  };
};

type Sentiment = "Neutral" | "Positive" | "Negative";

const StyledForm = styled.form``;
const StyledTabs = styled.div`
  display: flex;
`;
const Tab = styled.div`
  padding: 5px;
  cursor: pointer;
`;
const TabTitle = styled.div`
  border: 1px;
  padding: 10px;
`;
const Section = styled.section`
  border: 1px;
  padding: 10px;
  width: 80%;
  height: 80%;
`;
const Tweet = styled.div`
  padding: 5px;
`;

const Tabs: Sentiment[] = ["Positive", "Negative", "Neutral"]

const Home = ({ size, contents }: Props) => {
  const [tab, setTab] = useState<Sentiment>("Positive");

  return (
    <div className="container">
      <Head>
        <title>ネガポジ太郎</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <h1 className="title">
          ネガポジ太郎
        </h1>
        {size <= 0 ? (
          <StyledForm action="/" method="GET" >
            <input id="q" name="q" type="text"></input>
            <button type="submit">検索</button>
          </StyledForm>
        ) : (
          <>
            <div>検索結果</div>
            <StyledTabs>
              {Tabs.map(t => (
                <Tab key={t} onClick={useCallback(()=>setTab(t), [t])}>{t}</Tab>
              ))}
            </StyledTabs>
            <TabTitle>{tab}</TabTitle>
            <Section>
              {contents[tab] && contents[tab].map(c => (
                <Tweet key={c.id}>{c.text}</Tweet>
              ))}
            </Section>
          </>
        )}
      </main>
    </div>
  );
};

function getEndpoint(req: NextPageContext["req"]) {
  if(!req) {
    return "/api";
  }

  if (req.headers["x-now-deployment-url"]) {
    return `https://${req.headers['x-now-deployment-url']}/api`
  }
  
  const config = getConfig();
  if(config && config.publicRuntimeConfig != null) {
    return config.publicRuntimeConfig.APP_ENDPOINT;
  }
  return "/api";
}

Home.getInitialProps = async (ctx: NextPageContext) => {
  const {q} = ctx.query;
  if(!q || q.length <= 0) {
    return { size: 0, contents: {} };
  }
  
  const apiEndpoint = getEndpoint(ctx.req);
  const res = await fetch(`${apiEndpoint}/tweets?q=${encodeURIComponent(q as string)}`)
  return res.json();
};

export default Home
