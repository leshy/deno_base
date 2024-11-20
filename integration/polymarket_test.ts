import { assertEquals } from "@std/assert";
import { Polymarket } from "./polymarket.ts";
import { app } from "../utils/app.ts";
import { Config } from "../types.ts";

Deno.test("start", async function () {
    await app("baserate", async (config: Config) => {
        const polymarket = new Polymarket(config["polymarket"]);
        console.log("LISTING MARKETS");
        const res = await polymarket.listMarkets();
        console.log("MARKET LIST", res);
        // sleep for 10 s
        await new Promise((resolve) => setTimeout(resolve, 10000));
    });
});
