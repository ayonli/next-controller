import { describe, it } from "mocha";
import * as assert from "assert";
import _try from "@ayonli/jsext/try";
import axios from "axios";
import { useApi, HttpException } from "../src";
import type Example2Controller from "./pages/api/example2";

describe("HttpException", () => {
    it("should report http error via HttpException", async () => {
        let [err, res] = await _try<Error>(axios.delete("/api/example2?foo=Hello"));

        if (err) {
            // @ts-ignore
            res = err["response"];
        }

        assert.strictEqual(res.status, 400);
        assert.strictEqual(res.data, "Something went wrong");
    });

    it("should regenerate HttpException instance when using useApi()", async () => {
        const api = useApi<Example2Controller>("example2", "http://localhost:3000");
        const [err] = await _try<Error>(api.delete({ foo: "Hello" }));

        assert.ok(err instanceof HttpException);
        assert.strictEqual(err.code, 400);
        assert.strictEqual(err.message, "Something went wrong");
    });
});
