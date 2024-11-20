import { getFirstSecret } from "../utils/secrets.ts";
import { Wallet } from "@ethersproject/wallet";
import { ClobClient } from "@polymarket/clob-client";
import { deepMerge } from "https://deno.land/std/collections/mod.ts";

export interface PolyMarketConfig {
    chainId: number;
    clobApiUrl: string;
    publicKey: string;
    privateKey: string;
}

const defaultConfig: Partial<PolyMarketConfig> = {
    chainId: 137,
    clobApiUrl: "https://clob.polymarket.com",
};

export class Polymarket {
    public client?: ClobClient;
    private config: PolyMarketConfig;
    private wallet?: Wallet;

    constructor(config: Partial<PolyMarketConfig>) {
        this.config = deepMerge(
            defaultConfig,
            config,
        ) as unknown as PolyMarketConfig;
    }

    private async getWallet(): Promise<Wallet> {
        if (!this.wallet) {
            const publicKey = this.config["publicKey"];
            const privateKey = this.config["privateKey"];

            const wallet = new Wallet(privateKey);
            console.log(`Eth Wallet: ${await wallet.getAddress()}`);
            this.wallet = wallet;
        }
        return this.wallet;
    }

    private async getClient(): Promise<ClobClient> {
        if (!this.client) {
            const wallet = await this.getWallet();
            const { clobApiUrl, chainId } = this.config;
            console.log(
                `Instantiating polymarket CLOB Client: ${clobApiUrl}, Chain ID: ${chainId}`,
            );
            this.client = new ClobClient(clobApiUrl, chainId, wallet);
        }
        return this.client;
    }

    async listMarkets(): Promise<any> {
        const clobClient = await this.getClient();
        return await clobClient.getSamplingMarkets();
    }

    async getOrderBook(): Promise<any> {
        const clobClient = await this.getClient();
        return await clobClient.getOrderBook();
    }
}
