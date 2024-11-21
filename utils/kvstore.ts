import { Redis } from "ioredis";
import { deepMerge } from "https://deno.land/std/collections/mod.ts";

abstract class Service<CONFIG extends Record<string, unknown>> {
    protected config: CONFIG;

    constructor(config?: Partial<CONFIG>) {
        const defaults = this.getDefaultConfig();
        this.config = deepMerge(defaults, config || {}) as CONFIG;
    }

    protected abstract getDefaultConfig(): CONFIG;

    async start(): Promise<void> {
        // Stub method for optional implementation
    }

    async stop(): Promise<void> {
        // Stub method for optional implementation
    }
}

export abstract class KVStore<
    CONFIG extends Record<string, unknown>,
    T,
> extends Service<CONFIG> {
    abstract get(key: string): Promise<T | undefined>;
    abstract set(key: string, value: T): Promise<T>;
}

export type MemKVStoreConfig = {};

// MemKVStore implementation
export class MemKVStore<T> extends KVStore<MemKVStoreConfig, T> {
    private store: Record<string, T>;

    getDefaultConfig() {
        return {};
    }

    constructor() {
        super();
        this.store = {};
    }

    async get(key: string): Promise<T | undefined> {
        return this.store[key];
    }

    async set(key: string, value: T): Promise<T> {
        this.store[key] = value;
        return value;
    }
}

type RedisConfig = {};

export class RedisKVStore<T> extends KVStore<RedisConfig, T> {
    private client: Redis;

    getDefaultConfig() {
        return {};
    }

    constructor() {
        super();
        this.client = new Redis(); // Default configuration assumes Redis server is running on localhost:6379
    }

    async get(key: string): Promise<T | undefined> {
        const data = await this.client.get(key);

        if (data === null) {
            return undefined;
        }

        return JSON.parse(data) as T; // Assuming the stored data is JSON-serialized
    }

    async set(key: string, value: T): Promise<T> {
        await this.client.set(key, JSON.stringify(value));
        return value;
    }

    override async stop(): Promise<void> {
        await this.client.quit();
    }
}
