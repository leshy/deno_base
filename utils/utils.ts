export function isObject(value: unknown): value is object {
    return value !== null && typeof value === "object"
}

// lodash set
export function objSet(
    obj: Record<string, unknown>,
    path: string | string[],
    value: unknown,
): Record<string, unknown> {
    if (!isObject(obj)) {
        throw new Error("Target must be an object")
    }

    if (typeof path === "string") {
        path = path.split(".")
    }

    let current = obj
    path.forEach((key, index) => {
        if (index === path.length - 1) {
            current[key] = value
        } else {
            if (!current[key] || !isObject(current[key])) {
                current[key] = {}
            }
            // @ts-ignore
            current = current[key]
        }
    })

    return obj
}

export type MapperFunction<T> = (key: string, value: T) => [string, T]

export function deepMap<T>(
    obj: Record<string, T>,
    mapper: MapperFunction<T>,
): Record<string, T> {
    function recurse(currentObj: Record<string, T>): Record<string, T> {
        return Object.entries(currentObj).reduce(
            (acc, [key, value]) => {
                const [newKey, newValue] = mapper(key, value)

                // If the value is an object, recursively map it
                // @ts-ignore
                acc[newKey] = typeof newValue === "object" && newValue !== null
                    // @ts-ignore
                    ? recurse(newValue)
                    : newValue

                return acc
            },
            {} as Record<string, T>,
        )
    }

    return recurse(obj)
}
