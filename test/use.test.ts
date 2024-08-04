import { describe, it } from "mocha";
import _try from "@ayonli/jsext/try";
import * as assert from "assert";
import axios from "axios";

describe("@use", () => {
    it("should trigger the middleware bound by @use", async () => {
        let [err, res] = await _try<Error>(axios.post("/api/example2", { foo: "World" }));

        if (err) {
            // @ts-ignore
            res = err["response"];
        }

        const { data } = res;
        assert.deepStrictEqual(data, { bar: "Hello, World" });
    });
});
