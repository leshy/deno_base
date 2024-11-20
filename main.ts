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

    // console.log("LISTING MARKETS");
    // console.log("MARKET LIST", res);

    const markets = await polymarket.listMarkets();
    const tokens = markets.data[1].tokens;

    const tokenId = tokens[0].token_id;

    console.log(tokens);
    console.log("TOKEN ID", tokenId);
    const yes_prices_history = await polymarket.client.getPricesHistory({
        startTs: df.subDays(new Date(), 5).getTime() / 1000,
        endTs: new Date().getTime() / 1000,
        market: tokenId,
    } as PriceHistoryFilterParams);

    //console.log("orderbook", yes_prices_history.history);

    yes_prices_history.history.forEach((price) => {
        console.log(price);
    });

    // const hash = clobClient.getOrderBookHash(orderbook);
    // console.log("orderbook hash", hash);
});
