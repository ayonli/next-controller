import { api, ApiController } from "../../../src";
import * as bodyParser from "body-parser";

const jsonParser = bodyParser.json();
const urlencodedParser = bodyParser.urlencoded({ extended: true });

@api
export default class Example2Controller extends ApiController {
    constructor(req: any, res: any) {
        super(req, res);

        this.use(jsonParser)
            .use(urlencodedParser);
    }

    override async get(query: { foo: string; }) {
        return {
            bar: "Hello, " + query.foo
        };
    }

    override async post(body: { foo: string; }) {
        return {
            bar: "Hello, " + body.foo
        };
    }

    override async delete(query: { foo: string; }, body: { bar?: string; } = {}) {
        return { ...query, ...body };
    }

    override async head(query: { foo: string; }) {
        this.res.setHeader("query-foo", query.foo);
    }

    override async options(_: { foo: string; }) {
        this.res.setHeader("Allow",
            "DELETE, GET, HEAD, OPTIONS, PATCH, POST, PUT");
        return null;
    }

    override async patch(query: { foo: string; }, body: { bar: string; }) {
        return { ...query, ...body };
    }

    override async put(query: { foo: string; }, body: { bar: string; }) {
        return { ...query, ...body };
    }
}
