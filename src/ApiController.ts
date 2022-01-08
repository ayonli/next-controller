import * as qs from "qs";
import type { IncomingMessage, ServerResponse } from "http";
import isOwnKey from "@hyurl/utils/isOwnKey";
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

    use(middleware: Middleware) {
        this._middleware.push(middleware);
        return this;
    }

    delete?(query: object, body?: any): Promise<any>;
    get?(query: object): Promise<any>;
    head?(query: object): Promise<void>;
    options?(query: object): Promise<any>;
    patch?(query: object, body: any): Promise<any>;
    post?(body: any): Promise<any>;
    put?(query: object, body: any): Promise<any>;
    onError?(err: any): void;

    static onError?(err: any): void;

    static async __invoke(req: IncomingMessage, res: ServerResponse) {
        const url = new URL(req.url, "http://localhost");
        const query: object = qs.parse(url.search?.slice(1) || "", {
            ignoreQueryPrefix: true,
            allowDots: true,
            strictNullHandling: true,
        });

        if (req["query"]) {
            Object.assign(req["query"], query);
        } else {
            req["query"] = query;
        }

        const ins = new this(req, res);
        const method = req.method.toLowerCase();

        if (typeof ins[method] !== "function") {
            res.statusCode = 405;
            res.statusMessage = HttpStatus[405];
            res.end(res.statusMessage);
            return;
        }

        const invoke = ins.invoke || ApiController.prototype.invoke;
        await invoke.call(ins, method, req, res, async (req, res) => {
            try {
                let returns: any;

                // Invoke the handler method can get its returning value.
                if (method === "get" || method === "head") {
                    returns = await ins[method](req["query"]);
                } else if (method === "post") {
                    returns = await ins[method](req["body"]);
                } else {
                    returns = await ins[method](req["query"], req["body"]);
                }

                if (method === "head") {
                    res.end();
                    return returns;
                }

                const isResponseTypeSet = res.hasHeader("Content-Type");

                // Respond the returning value to the client respectively.
                if ([
                    "boolean",
                    "number",
                    "object"
                ].includes(typeof returns)) {
                    if (typeof res["send"] === "function") {
                        res["send"](returns);
                    } else {
                        if (!isResponseTypeSet) {
                            res.setHeader("Content-Type",
                                "application/json; charset=utf-8");
                        }

                        res.end(JSON.stringify(returns));
                    }
                } else if (returns !== void 0) {
                    if (!isResponseTypeSet) {
                        res.setHeader("Content-Type",
                            "text/plain; charset=utf-8");
                    }

                    if (typeof res["send"] === "function") {
                        res["send"](String(returns));
                    } else {
                        res.end(String(returns));
                    }
                }

                // Returns the returning values so the previous middleware
                // can await for it.
                return returns;
            } catch (err) {
                res.setHeader("Content-Type", "text/plain; charset=utf-8");

                if (err instanceof Error) {
                    if (err.name === "HttpException") {
                        res.statusCode = Number(err["code"]) || 500;
                    } else {
                        res.statusCode = 500;
                    }

                    res.statusMessage = HttpStatus[res.statusCode];
                    res.end(err.message);
                } else {
                    res.statusCode = 500;
                    res.statusMessage = HttpStatus[res.statusCode];
                    res.end(String(err));
                }

                // Re-throw the error so the previous middleware can catch
                // it.
                throw err;
            }
        });
    }

    protected async invoke(
        method: string,
        req: IncomingMessage,
        res: ServerResponse,
        handle: (req: IncomingMessage, res: ServerResponse) => Promise<any>
    ) {
        const middleware: Middleware[] = [];

        if (isOwnKey(this, "_middleware")) {
            // If the controller isn't a subclass of ApiController,
            // `_middleware` could be missing.
            middleware.push(...this["_middleware"]);
        }

        if (isOwnKey(this.constructor, Symbol.for("middleware"))) {
            // If `@use` has never been used on the controller,
            // `this[Symbol.for("middleware")]` could be missing.
            middleware.push(
                ...(this.constructor[Symbol.for("middleware")][method] || [])
            );
        }

        middleware.push(handle);

        try {
            const applyMiddleware = this.applyMiddleware
                || ApiController.prototype.applyMiddleware;
            await applyMiddleware.call(this, middleware, req, res);
        } catch (err) {
            this._handleError(err);
        }
    }

    protected async applyMiddleware(
        middleware: Middleware[],
        req: IncomingMessage,
        res: ServerResponse,
    ) {
        let _this = this;
        let i = 0;

        // Recursively invokes all the middleware.
        await (async function next() {
            // Express `next(err)`
            if (arguments.length &&
                (arguments[0] instanceof Error || typeof arguments[0] === "string")
            ) {
                _this._handleError?.(arguments[0]);
                return;
            }

            const handle = middleware[i++];

            if (handle?.length === 4) { // Express `(err, req, res, next) => void`
                return await handle.call(_this, null, req, res, next);
            } else if (handle) {
                return await handle.call(_this, req, res, next);
            }
        })();
    }

    private _handleError(err: any) {
        if (typeof this.onError === "function") {
            this.onError(err);
        } else if (typeof (this.constructor as any).onError === "function") {
            (this.constructor as any).onError(err);
        } else if (err["name"] !== "HttpException") {
            console.error(err);
        }
    }
}
