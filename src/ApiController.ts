import * as qs from "qs";
import type { IncomingMessage, ServerResponse } from "http";
import isOwnKey from "@hyurl/utils/isOwnKey";
import isOwnMethod from "@hyurl/utils/isOwnMethod";
import { HttpStatus } from "./HttpException";

export type Middleware = (
    req: IncomingMessage,
    res: ServerResponse,
    next: () => any
) => any;

export default class ApiController {
    private _middleware: Middleware[] = [];

    constructor(
        protected req: IncomingMessage,
        protected res: ServerResponse
    ) { }

    useMiddleware(middleware: Middleware) {
        this._middleware.push(middleware);
        return this;
    }

    static async __invoke(req: IncomingMessage, res: ServerResponse) {
        const method = req.method.toLowerCase();
        let query: object = req["query"];

        if (!isOwnMethod(this.prototype, method)) {
            res.statusCode = 405;
            res.statusMessage = HttpStatus[405];
            res.end(res.statusMessage);
            return;
        }

        if (!query) {
            let url = new URL(req.url, "http://localhost");
            query = req["query"] = qs.parse(url.search?.slice(1) || "");
        }

        const ins = new this(req, res);

        const middleware: Middleware[] = [];

        if (isOwnKey(ins, "_middleware")) {
            // If the controller isn't a subclass of ApiController,
            // `_middleware` could be missing.
            middleware.push(...ins._middleware);
        }

        if (isOwnKey(this, Symbol.for("middleware"))) {
            // If `@useMiddleware` has never been used on the controller,
            // `this[Symbol.for("middleware")]` could be missing.
            middleware.push(...(this[Symbol.for("middleware")][method] || []));
        }

        // Use the request handler method as a middleware.
        middleware.push(async (req, res) => {
            try {
                let returns: any;

                // Invoke the handler method can get its returning value.
                if (method === "get" || returns === "head") {
                    returns = await ins[method](query);
                } else if (method === "post") {
                    returns = await ins[method](req["body"]);
                } else {
                    returns = await ins[method](query, req["body"]);
                }

                if (method === "head") {
                    res.end;
                    return returns;
                }

                const isResponseTypeSet = res.hasHeader("Content-Type");

                // Respond the returning value to the client respectively.
                if ([
                    "boolean",
                    "number",
                    "object"
                ].includes(typeof returns)) {
                    if (!isResponseTypeSet) {
                        res.setHeader("Content-Type",
                            "application/json; charset=utf-8");
                    }

                    res.end(JSON.stringify(returns));
                } else if (returns !== void 0) {
                    if (!isResponseTypeSet) {
                        res.setHeader("Content-Type",
                            "text/plain; charset=utf-8");
                    }

                    res.end(String(returns));
                }

                // Returns the returning values so the previous middleware
                // can await for it.
                return returns;
            } catch (err) {
                if (err instanceof Error) {
                    if (err.name === "HttpException") {
                        res.statusCode = Number(err["code"]);
                    } else {
                        res.statusCode = 500;
                    }

                    res.statusMessage = err.message;
                    res.end(err.message);
                } else {
                    res.statusCode = 500;
                    res.statusMessage = String(err);
                    res.end(String(err));
                }

                // Re-throw the error so the previous middleware can catch
                // it.
                throw err;
            }
        });

        applyMiddleware(middleware, req, res);
    }
}

function applyMiddleware(
    middleware: Middleware[],
    req: IncomingMessage,
    res: ServerResponse,
) {
    let i = 0;

    // Recursively invokes all the middleware.
    (async function next() {
        // Express `next(err)`
        if (arguments.length &&
            (arguments[0] instanceof Error || typeof arguments[0] === "string")
        ) {
            throw arguments[0];
        }

        const handle = middleware[i++];

        if (handle?.length === 4) { // Express `(err, req, res, next) => void`
            return await handle.call(void 0, null, req, res, next);
        } else if (handle) {
            return await handle(req, res, next);
        }
    })();
}
