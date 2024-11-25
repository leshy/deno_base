import { deepMap, objSet } from "./utils.ts"
import { deepMerge } from "https://deno.land/std/collections/mod.ts"
import { join } from "https://deno.land/std/path/mod.ts"

/**
 * Reads JSON files in a directory, loads them in alphabetical order, and overlays them into a dictionary.
 *
 * @param {string} directoryPath The path to the directory containing the JSON files.
 * @returns {Promise<CONFIG>} A promise that resolves to the combined configuration.
 */
export async function jsonConfigProvider<
    CONFIG extends Record<string, unknown>,
>(directoryPath: string): Promise<Partial<CONFIG>> {
    async function readConfigFile(filePath: string): Promise<CONFIG> {
        if (filePath.endsWith(".enc.json")) {
            // Process encrypted file using sops
            return parseEncryptedConfig(filePath)
        } else if (filePath.endsWith(".json")) {
            // Process normal JSON file
            return parseJsonConfig(filePath)
        } else {
            throw new Error(
                "Unsupported file extension. Please specify a .json or .enc.json file.",
            )
        }
    }

    async function parseJsonConfig(filePath: string): Promise<CONFIG> {
        const jsonString = await Deno.readTextFile(filePath)
        return JSON.parse(jsonString)
    }

    async function parseEncryptedConfig(filePath: string): Promise<CONFIG> {
        const command = new Deno.Command("sops", {
            args: ["--decrypt", filePath],
        })

        const { code, stdout, stderr } = await command.output()
        if (code != 0) {
            const errorString = new TextDecoder().decode(stderr)
            throw new Error(`Failed to decrypt config: ${errorString}`)
        }
        const jsonString = new TextDecoder().decode(stdout)
        return JSON.parse(jsonString)
    }

    try {
        // Read files from the directory
        const files: string[] = []
        for await (const dirEntry of Deno.readDir(directoryPath)) {
            if (dirEntry.isFile && dirEntry.name.endsWith(".json")) {
                files.push(join(directoryPath, dirEntry.name))
            }
        }

        // Sort files alphabetically
        files.sort()

        // Combine JSON configurations
        return files.reduce(
            // @ts-ignore
            async (fullConfig: Partial<CONFIG>, filePath: string) =>
                deepMerge(fullConfig, await readConfigFile(filePath)),
            {},
        ) as unknown as Partial<CONFIG>
    } catch (error) {
        console.error("Error reading JSON config files:", error)
        throw error
    }
}

/**
 * Reads environment variables with a specified prefix and returns a deep dictionary CONFIG object.
 *
 * @param {string} prefix - The prefix for environment variables to consider.
 * @returns {Promise<CONFIG>} A promise that resolves to the deep configuration object.
 */
export async function envConfigProvider<CONFIG extends Record<string, unknown>>(
    prefix: string,
): Promise<Partial<CONFIG>> {
    const config: Partial<CONFIG> = {}

    // Get all environment variables
    const env = Deno.env.toObject()

    // Filter the environment variables by the specified prefix
    const prefixUpper = prefix.toUpperCase()

    for (const [key, value] of Object.entries(env)) {
        if (key.startsWith(prefixUpper)) {
            // Remove prefix and normalize key, then split by underscore to handle nesting
            const pathParts = key
                .slice(prefixUpper.length + 1) // +1 to remove the trailing underscore
                .toLowerCase()
                .split("_")

            // Build the nested configuration object
            try {
                objSet(config, pathParts, JSON.parse(value))
            } catch {
                objSet(config, pathParts, value)
            }
        }
    }

    return config as Partial<CONFIG>
}

const redactSet = new Set([
    "token",
    "key",
    "secret",
    "password",
    "privateKey",
    "privatekey",
    "private_key",
])

export const redact = <CONFIG extends Record<string, unknown>>(
    config: CONFIG,
): Partial<CONFIG> =>
    deepMap(
        config,
        (key: string, value: unknown) =>
            redactSet.has(key.toLowerCase())
                ? [key, "▬▬▬▬▬▬▬▬▬▬▬▬"]
                : [key, value],
    ) as Partial<CONFIG>
