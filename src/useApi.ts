import * as qs from "qs";
import HttpException from "./HttpException";
import { saveAs } from "file-saver";

// polyfill
Error.captureStackTrace ??= require("capture-stack-trace");

export default function useApi<T>(
    path: string,
    base = "",
    options: Omit<RequestInit, "method" | "body"> = {}
): T {
    const url = (base || "") + "/api/" + path;

    return {
        delete: callApi.bind(void 0, url, { ...options, method: "DELETE" }),
        get: callApi.bind(void 0, url, { ...options, method: "GET" }),
        head: callApi.bind(void 0, url, { ...options, method: "HEAD" }),
        options: callApi.bind(void 0, url, { ...options, method: "OPTIONS" }),
        patch: callApi.bind(void 0, url, { ...options, method: "PATCH" }),
        post: callApi.bind(void 0, url, { ...options, method: "POST" }, null),
        put: callApi.bind(void 0, url, { ...options, method: "PUT" })
    } as any;
}

async function callApi(
    url: string,
    options: Omit<RequestInit, "body"> = {},
    query: object,
    body = void 0,
    extraHeaders: HeadersInit = {}
) {
    const { method } = options;
    const headers = { ...(options.headers ?? {}) };

    url += qs.stringify(query, {
        allowDots: true,
        encodeValuesOnly: true,
        addQueryPrefix: true,
        strictNullHandling: true,
    });

    if (["GET", "HEAD", "OPTIONS"].includes(method) && body) {
        extraHeaders = body;
        body = void 0;
    }

    if (typeof body === "object") {
        if (typeof FormData !== "function" || !(body instanceof FormData)) {
            headers["Content-Type"] ||= "application/json; charset=utf-8";
            body = JSON.stringify(body);
        }
    } else if (body !== void 0) {
        headers["Content-Type"] ||= "text/plain; charset=utf-8";
        body = String(body);
    }

    const trace: { stack?: string; } = {};
    Error.captureStackTrace(trace);

    const res = await fetch(url, {
        ...options,
        method,
        headers: { ...headers, ...extraHeaders },
        body
    });
    let err: Error;

    if (res.status < 400) {
        const type = res.headers.get("Content-Type") ?? "";
        let returns: any;

        if (type.includes("/json")) {
            returns = await res.json();
        } else if (type.startsWith("text/")) {
            returns = await res.text();
        } else {
            returns = await res.blob();

            const disposition = res.headers.get("Content-Disposition") ?? "";

            if (disposition.startsWith("attachment")) {
                const filename = disposition.match(/filename\*=UTF-?8''(.+)/i)?.[1]
                    ?? disposition.match(/filename="(.+)"/)?.[1];

                saveAs(returns, filename ? decodeURIComponent(filename) : null);
                returns = void 0;
            }
        }

        return returns;
    } else if (res.status === 405) {
        err = new ReferenceError(
            `ApiController.${method.toLowerCase()} is not implemented`);
    } else {
        err = new HttpException(
            (await res.text()) || res.statusText || "Unknown",
            res.status);
    }

    // Append stack trace
    err.stack = err.stack + "\n" + trace.stack.split("\n").slice(5).join("\n");

    throw err;
}
