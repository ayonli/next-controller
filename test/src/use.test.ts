import * as assert from "assert";
import axios from "axios";

describe("@use", () => {
    it("should trigger the middleware bound by @use", async () => {
        const { data } = await axios.post("/api/example2", { foo: "World" });
        assert.deepStrictEqual(data, { bar: "Hello, World" });
    });
});
