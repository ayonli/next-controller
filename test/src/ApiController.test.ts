import * as assert from "assert";
import axios from "axios";

describe("ApiController", () => {
    it("should trigger get method with query", async () => {
        const { data } = await axios.get("/api/example?foo=World");
        assert.deepStrictEqual(data, { bar: "Hello, World" });
    });

    it("should trigger post method with body along with middleware", async () => {
        const { data } = await axios.post("/api/example", { foo: "World" });
        assert.deepStrictEqual(data, { bar: "Hello, World" });
    });

    it("should trigger delete method with query and body", async () => {
        const { data } = await axios.delete("/api/example?foo=Hello", {
            data: { bar: "World" }
        });

        assert.deepStrictEqual(data, { foo: "Hello", bar: "World" });
    });

    it("should trigger head method with query", async () => {
        const { headers } = await axios.head("/api/example?foo=Hello");
        assert.strictEqual(headers["query-foo"], "Hello");
    });

    it("should trigger options method with query and respond with body", async () => {
        const { data, headers } = await axios.options("/api/example?foo=World");
        assert.deepStrictEqual(data, { bar: "Hello, World" });
        assert.strictEqual(headers["allow"],
            "DELETE, GET, HEAD, OPTIONS, PATCH, POST, PUT");
    });

    it("should trigger patch method with query and body", async () => {
        const { data } = await axios.patch("/api/example?foo=Hello", {
            bar: "World"
        });

        assert.deepStrictEqual(data, { foo: "Hello", bar: "World" });
    });

    it("should trigger put method with query and body", async () => {
        const { data } = await axios.put("/api/example?foo=Hello", {
            bar: "World"
        });

        assert.deepStrictEqual(data, { foo: "Hello", bar: "World" });
    });
});
