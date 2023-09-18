import * as qs from "qs";
import type { IncomingMessage, ServerResponse } from "http";
import { as, hasOwn } from "@ayonli/jsext/object";
import HttpException, { HttpStatus } from "./HttpException";
import { Constructor } from "@ayonli/jsext";

export const _middleware = Symbol.for("middleware");

export type Middleware = (
    req: IncomingMessage,
    res: ServerResponse,
    next: (err?: any) => Promise<any>
) => any;

export interface Request extends IncomingMessage {
    query?: qs.ParsedQs;
    body?: any;
}

export interface Response extends ServerResponse {
    send?: (data: any) => any;
}

export default class ApiController {
    private _middleware: Middleware[] = [];

    constructor(
        protected req: IncomingMessage,
        protected res: ServerResponse
    ) { }

    protected use(middleware: Middleware) {
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
    protected onError?(err: any): void;

    static onError?(err: any): void;

    static async __invoke(req: Request, res: Response) {
        const url = new URL(req.url as string, "http://localhost");
        const query = qs.parse(url.search?.slice(1) || "", {
            ignoreQueryPrefix: true,
            allowDots: true,
            strictNullHandling: true,
        });

        if (req.query) {
            Object.assign(req.query, query);
        } else {
            req.query = query;
        }

        const ins = new this(req, res);
        const method = (req.method as string).toLowerCase();

        if (typeof (ins as any)[method] !== "function") {
            res.statusCode = 405;
            res.statusMessage = HttpStatus[405] || "";
            res.end(res.statusMessage);
            return;
        }

        const invoke = ins.invoke || ApiController.prototype.invoke;
        await invoke.call(ins, method, req, res, async (req, res) => {
            try {
                let returns: any;

                // Invoke the handler method can get its returning value.
                if (method === "get" || method === "head") {
                    returns = await (ins as any)[method](req.query);
                } else if (method === "post") {
                    returns = await (ins as any)[method](req.body);
                } else {
                    returns = await (ins as any)[method](req.query, req.body);
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
                        res.statusCode = as(err, HttpException)?.code || 500;
                    } else {
                        res.statusCode = 500;
                    }

                    res.statusMessage = HttpStatus[res.statusCode] ?? "";
                    res.end(err.message);
                } else {
                    res.statusCode = 500;
                    res.statusMessage = HttpStatus[res.statusCode] ?? "";
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
        req: Request,
        res: Response,
        handle: (req: Request, res: Response) => Promise<any>
    ) {
        const ctor = this.constructor as Constructor<any>;
        const middleware: Middleware[] = [];

        if (hasOwn(this, "_middleware")) {
            // If the controller isn't a subclass of ApiController,
            // `_middleware` could be missing.
            middleware.push(...this["_middleware"]);
        }

        if (hasOwn(ctor.prototype[method], _middleware)) {
            middleware.push(...(ctor.prototype[method][_middleware] || []));
        }

        middleware.push(handle);

        try {
            const applyMiddleware = this.applyMiddleware
                || ApiController.prototype.applyMiddleware;
            await applyMiddleware.call(this, middleware, req, res);
        } catch (err) {
            console.log(err);
            this._handleError?.(err);
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
                // @ts-ignore
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
