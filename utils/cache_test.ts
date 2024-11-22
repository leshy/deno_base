import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { KVStore, MemKVStore, RedisKVStore } from "./kvstore.ts";
import { permaCache } from "./cache.ts";

type KVStoreFactory = () => Promise<KVStore<Record<string, unknown>, any>>;

async function runTests<T>(KVStoreF: KVStoreFactory) {
    const store = await KVStoreF();
    const name = store.constructor.name;

    class ExampleService {
        public counter = 0;
        @permaCache(store) // Use new store for each instance
        async computeValue(x: number, y: number): Promise<number> {
            return await this.computation(x, y);
        }

        async computation(x: number, y: number): Promise<number> {
            this.counter++;
            return x + y;
        }
    }

    Deno.test(
        name + " permaCache decorator should cache function results",
        async () => {
            const service = new ExampleService();
            const result1 = await service.computeValue(1, 2);
            assertEquals(
                result1,
                3,
                "First computation should return correct result",
            );

            const result2 = await service.computeValue(1, 2);
            assertEquals(
                result2,
                3,
                "Cached result should return correct result",
            );

            assertEquals(
                service.counter,
                1,
                "Cached result should not recompute",
            );
        },
    );

    Deno.test(
        name + " permaCache decorator should compute value on cache miss",
        async () => {
            const service = new ExampleService();
            const result = await service.computeValue(3, 4);
            assertEquals(
                result,
                7,
                "New computation should return correct result",
            );

            assertEquals(service.counter, 1, "Should compute value once");
        },
    );

    Deno.test(
        name + " permaCache should correctly handle different arguments",
        async () => {
            const service = new ExampleService();
            const result1 = await service.computeValue(5, 5);
            assertEquals(
                result1,
                10,
                "Should return correct result for inputs 5, 5",
            );

            const result2 = await service.computeValue(0, 0);
            assertEquals(
                result2,
                0,
                "Should return correct result for inputs 0, 0",
            );

            const result3 = await service.computeValue(-1, 1);
            assertEquals(
                result3,
                0,
                "Should return correct result for inputs -1, 1",
            );

            assertEquals(
                service.counter,
                3,
                "Should compute value for each unique input",
            );
        },
    );
}

await runTests(async () => new MemKVStore());

await runTests(async () => {
    const redisKVStore = new RedisKVStore();
    await redisKVStore.deleteKeysByPattern("computeValue:*");
    return redisKVStore;
});
