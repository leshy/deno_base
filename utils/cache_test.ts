import { assertEquals } from "https://deno.land/std@0.224.0/assert/assert_equals.ts"
import { KVStore, MemKVStore, RedisKVStore } from "./kvstore.ts"
import { cache } from "./cache.ts"

type KVStoreFactory = () => Promise<KVStore<Record<string, unknown>, number>>

async function runTests<T>(KVStoreF: KVStoreFactory) {
    const store = await KVStoreF()
    const name = store.constructor.name

    class ExampleService {
        public counter = 0
        @cache(store)
        async computeValue(x: number, y: number): Promise<number> {
            return await this.computation(x, y)
        }

        async computation(x: number, y: number): Promise<number> {
            this.counter++
            await new Promise((resolve) => setTimeout(resolve, 10))
            return x + y
        }
    }

    Deno.test(
        name + " cache decorator should cache function results",
        async () => {
            const service = new ExampleService()
            const result1 = await service.computeValue(1, 2)

            assertEquals(
                result1,
                3,
                "First computation should return correct result",
            )

            const result2 = await service.computeValue(1, 2)
            assertEquals(
                result2,
                3,
                "Cached result should return correct result",
            )

            assertEquals(
                service.counter,
                1,
                "Cached result should not recompute",
            )
        },
    )

    Deno.test(
        name + " cache decorator should compute value on cache miss",
        async () => {
            const service = new ExampleService()
            const result = await service.computeValue(3, 4)
            assertEquals(
                result,
                7,
                "New computation should return correct result",
            )

            assertEquals(service.counter, 1, "Should compute value once")
        },
    )

    Deno.test(
        name + " cache should correctly handle different arguments",
        async () => {
            const service = new ExampleService()
            const result1 = await service.computeValue(5, 5)
            assertEquals(
                result1,
                10,
                "Should return correct result for inputs 5, 5",
            )

            const result2 = await service.computeValue(0, 0)
            assertEquals(
                result2,
                0,
                "Should return correct result for inputs 0, 0",
            )

            const result3 = await service.computeValue(-1, 1)
            assertEquals(
                result3,
                0,
                "Should return correct result for inputs -1, 1",
            )

            const result4 = await service.computeValue(-1, 1)
            assertEquals(
                result4,
                0,
                "Should return correct cached result for inputs -1, 1",
            )

            assertEquals(
                service.counter,
                3,
                "Should compute value for each unique input",
            )
        },
    )
}

await runTests(async () => new MemKVStore())

await runTests(async () => {
    const redisKVStore = new RedisKVStore()
    await redisKVStore.deleteKeysByPattern("computeValue:*")
    return redisKVStore as RedisKVStore<number>
})
