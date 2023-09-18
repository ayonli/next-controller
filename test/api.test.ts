import { describe, it } from "mocha";
import * as assert from "assert";
import axios from "axios";

describe("@api", () => {
    it("should use an ordinary class as controller", async () => {
        const { data } = await axios.get("/api/example2?foo=World");
        assert.deepStrictEqual(data, { bar: "Hello, World" });
    });
});
