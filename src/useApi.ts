import * as qs from "qs";
import { saveFile } from "@ayonli/jsext/dialog";
import HttpException from "./HttpException";

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
        post: callApi.bind(void 0, url, { ...options, method: "POST" }, {}),
        put: callApi.bind(void 0, url, { ...options, method: "PUT" })
    } as any;
}

export async function callApi(
    url: string,
    options: Omit<RequestInit, "body"> = {},
    query: object,
    body: any = void 0,
    extraHeaders: HeadersInit = {}
) {
    const { method } = options;
    const headers = { ...(options.headers ?? {}) } as { [x: string]: any; };

    url += qs.stringify(query, {
        allowDots: true,
        encodeValuesOnly: true,
        addQueryPrefix: true,
        strictNullHandling: true,
    });

    if (method && ["GET", "HEAD", "OPTIONS"].includes(method) && body) {
        extraHeaders = body;
        body = void 0;
    }

    if (typeof body === "object") {
        if ((typeof FormData !== "function" || !(body instanceof FormData)) &&
            (typeof Blob !== "function" || !(body instanceof Blob)) &&
            (typeof ArrayBuffer !== "function" || !(body instanceof ArrayBuffer)) &&
            (typeof Uint8Array !== "function" || !(body instanceof Uint8Array))
        ) {
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
            const disposition = res.headers.get("Content-Disposition") ?? "";

            if (disposition.startsWith("attachment")) {
                returns = await res.blob();
                const filename = disposition.match(/filename\*=UTF-?8''(.+)/i)?.[1]
                    ?? disposition.match(/filename="(.+)"/)?.[1];

                saveFile(returns as Blob, {
                    name: filename ? decodeURIComponent(filename) : void 0,
                });
                returns = void 0;
            } else {
                returns = await res.arrayBuffer();
            }
        }

        return returns;
    } else if (res.status === 405) {
        err = new ReferenceError(
            `ApiController.${String(method).toLowerCase()} is not implemented`);
    } else {
        err = new HttpException(
            (await res.text()) || res.statusText || "Unknown",
            res.status);
    }

    // Append stack trace
    err.stack = err.stack + "\n" + trace.stack?.split("\n").slice(5).join("\n");

    throw err;
}
