import { api, ApiController } from "../../../..";
import * as bodyParser from "body-parser";

const jsonParser = bodyParser.json();
const urlencodedParser = bodyParser.urlencoded({ extended: true });

@api
export default class Example2Controller extends ApiController {
    constructor(req, res) {
        super(req, res);

        this.use(jsonParser)
            .use(urlencodedParser);
    }

    async get(query: { foo: string; }) {
        return {
            bar: "Hello, " + query.foo
        };
    }

    async post(body: { foo: string; }) {
        return {
            bar: "Hello, " + body.foo
        };
    }

    async delete(query: { foo: string; }, body: { bar?: string; } = {}) {
        return { ...query, ...body };
    }

    async head(query: { foo: string; }) {
        this.res.setHeader("query-foo", query.foo);
    }

    async options(query: { foo: string; }) {
        this.res.setHeader("Allow",
            "DELETE, GET, HEAD, OPTIONS, PATCH, POST, PUT");
        return {
            bar: "Hello, " + query.foo
        };
    }

    async patch(query: { foo: string; }, body: { bar: string; }) {
        return { ...query, ...body };
    }

    async put(query: { foo: string; }, body: { bar: string; }) {
        return { ...query, ...body };
    }
}
