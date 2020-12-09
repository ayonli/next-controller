import * as qs from "qs";
import isEmpty from "@hyurl/utils/isEmpty";
import HttpException from "./HttpException";

export default function useApi<T>(
    path: string,
    base = "",
    options: Omit<RequestInit, "method" | "body"> = {}
): T {
    const url = base + "/api/" + path;

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
) {
    const { method, headers = {} } = options;

    if (!isEmpty(query)) {
        url += "?" + qs.stringify(query);
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

    const res = await fetch(url, { ...options, method, headers, body });
    let err: Error;

    if (res.status < 400) {
        let returns: any;

        if (res.headers.get("Content-Type")?.includes("json")) {
            returns = await res.json();
        } else {
            returns = await res.text();
        }

        return returns;
    } else if (res.status === 405) {
        err = new ReferenceError(
            `ApiController.${method.toLowerCase()} is not implemented`);
    } else {
        err = new HttpException(
            res.statusText || (await res.text()) || "Unknown",
            res.status);
    }

    // Append stack trace
    err.stack = err.stack + "\n" + trace.stack.split("\n").slice(5).join("\n");

    throw err;
}
