import { api, use, HttpException } from "../../../src";
import * as bodyParser from "body-parser";

const jsonParser = bodyParser.json();
const urlencodedParser = bodyParser.urlencoded({ extended: true });

@api
export default class ExampleController {
    async get(query: { foo: string; }) {
        return {
            bar: "Hello, " + query.foo
        };
    }

    @use(jsonParser)
    @use(urlencodedParser)
    async post(body: { foo: string; }) {
        return {
            bar: "Hello, " + body.foo
        };
    }

    async delete(_: { foo: string; }) {
        throw new HttpException("Something went wrong", 400);
    }
}
