import { assertEquals } from "@std/assert";
import { getSecret, getUsers, getFirstSecret, stubbable } from "./secrets.ts";

const testUsers = `test.com
├── testuser@localhost
└── user2@localhost`;

const returns = [testUsers, testUsers, "testpassword", "testpassword"];

stubbable.exec = async (): Promise<string> => returns.shift() as string;

Deno.test("list users", async function () {
    const users = await getUsers("test.com");
    assertEquals(users, ["testuser@localhost", "user2@localhost"]);
});

Deno.test("get first secret", async function () {
    const secret = await getFirstSecret("test.com");
    assertEquals(secret, {
        username: "testuser@localhost",
        password: "testpassword",
    });
});

Deno.test("get specific secret", async function test_secret() {
    const secret = await getSecret("test.com", "testuser@localhost");
    assertEquals(secret, "testpassword");
});
