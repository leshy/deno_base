import { app } from "./utils/app.ts";
import { Config } from "./types.ts";
import { Polymarket } from "./integration/polymarket.ts";
import * as df from "npm:date-fns";

import {
    PriceHistoryFilterParams,
    PriceHistoryInterval,
} from "@polymarket/clob-client";

app("baserate", async (config: Config) => {
    const polymarket = new Polymarket(config["polymarket"]);
    const markets = (await polymarket.listMarkets()).data;

    const market = markets.find((market) =>
        market.question.includes("Kurakhove"),
    );

    const tokens = market.tokens;

    const tokenId = tokens[0].token_id;

    console.log(tokens);
    console.log("TOKEN ID", tokenId);

    // const yes_prices_history = await polymarket.client.getPricesHistory({
    //     startTs: df.subDays(new Date(), 5).getTime() / 1000,
    //     endTs: new Date().getTime() / 1000,
    //     market: tokenId,
    // } as PriceHistoryFilterParams);

    // yes_prices_history.history.forEach((price) => {
    //     console.log(price);
    // });

    await Promise.all(
        tokens.map(async (token) => {
            console.log(await polymarket.client.getOrderBook(token.token_id));
        }),
    );
});
