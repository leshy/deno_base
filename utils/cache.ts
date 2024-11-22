import { KVStore } from "./kvstore.ts";

export function cache<ReturnType>(
    cache: KVStore<any, ReturnType>,
    keyGenerator?: (...args: any[]) => string,
) {
    return function <TargetType, ArgsType extends any[]>(
        target: TargetType,
        propertyKey: string | symbol,
        descriptor: TypedPropertyDescriptor<
            (...args: ArgsType) => Promise<ReturnType>
        >,
    ): void {
        const originalMethod = descriptor.value;

        if (!originalMethod) {
            throw new Error("Decorator can only be used on methods");
        }

        descriptor.value = async function (
            ...args: ArgsType
        ): Promise<ReturnType> {
            const cacheKey = keyGenerator
                ? keyGenerator(...args)
                : `${String(propertyKey)}:${JSON.stringify(args)}`;

            const cachedResult = await cache.get(cacheKey);

            // console.log({
            //     name: cache.constructor.name,
            //     args,
            //     cacheKey,
            //     cachedResult,
            // });

            if (cachedResult !== undefined) {
                return cachedResult;
            }

            const result = await originalMethod.apply(this, args);
            await cache.set(cacheKey, result);
            return result;
        };
    };
}
