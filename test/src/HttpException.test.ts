import * as assert from "assert";
import axios, { AxiosResponse } from "axios";
import { useApi, HttpException } from "../..";
import type Example2Controller from "./pages/api/example2";

describe("HttpException", () => {
    it("should report http error via HttpException", async () => {
        let res: AxiosResponse;

        try {
            await axios.delete("/api/example2?foo=Hello");

        } catch (err) {
            res = err["response"];
        }

        assert.strictEqual(res.status, 400);
        assert.strictEqual(res.statusText, "Something went wrong");
        assert.strictEqual(res.data, "Something went wrong");
    });

    it("should regenerate HttpException instance when using useApi()", async () => {
        let err: HttpException;

        try {
            await useApi<Example2Controller>("example2", "http://localhost:3000")
                .delete({ foo: "Hello" });
        } catch (e) {
            err = e;
        }

        assert(err instanceof HttpException);
        assert.strictEqual(err.code, 400);
        assert.strictEqual(err.message, "Something went wrong");
    });
});
