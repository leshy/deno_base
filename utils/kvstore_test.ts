import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { KVStore, MemKVStore, RedisKVStore } from "./kvstore.ts";

async function runTests<T>(KVStore: KVStoreFactory) {
    const storeName = KVStore().constructor.name;

    Deno.test(storeName + " set and get functionality", async () => {
        const store = KVStore();
        await store.start();

        await store.set("key1", "value1" as unknown as T);
        const value = await store.get("key1");
        assertEquals(value, "value1" as unknown as T);

        await store.stop();
    });

    Deno.test(storeName + " get non-existent key", async () => {
        const store = KVStore();
        await store.start();

        const value = await store.get("unknownKey");
        assertEquals(value, undefined);

        await store.stop();
    });

    Deno.test(storeName + " delete existing key", async () => {
        const store = KVStore();
        await store.start();

        await store.set("key1", "value1" as unknown as T);
        const value = await store.delete("key1");
        assertEquals(value, true);

        await store.stop();
    });

    Deno.test(storeName + " delete non-existent key", async () => {
        const store = KVStore();
        await store.start();

        const value = await store.delete("unknownKey");
        assertEquals(value, false);

        await store.stop();
    });
}

function each<T>(params: Record<string, T>, cb: (p: T) => void) {
    Object.keys(params).map((title) => {
        cb(params[title]);
    });
}

type KVStoreFactory = () => KVStore<Record<string, unknown>, any>;

await runTests(() => new MemKVStore());
await runTests(() => new RedisKVStore());
