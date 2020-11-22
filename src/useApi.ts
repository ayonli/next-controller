import * as qs from "qs";
import isEmpty from "@hyurl/utils/isEmpty";
import HttpException from "./HttpException";

export default function useApi<T>(path: string, base = ""): T {
    const url = base + "/api/" + path;

    return {
        delete: callApi.bind(void 0, "DELETE", url),
        get: callApi.bind(void 0, "GET", url),
        head: callApi.bind(void 0, "HEAD", url),
        options: callApi.bind(void 0, "OPTIONS", url),
        patch: callApi.bind(void 0, "PATCH", url),
        post: callApi.bind(void 0, "POST", url, null),
        put: callApi.bind(void 0, "PUT", url)
    } as any;
}

async function callApi(
    method: string,
    url: string,
    query: object,
    body = void 0
) {
    const headers = {};

    if (!isEmpty(query)) {
        url += "?" + qs.stringify(query);
    }

    if (typeof body === "object") {
        if (typeof FormData !== "function" || !(body instanceof FormData)) {
            headers["Content-Type"] = "application/json; charset=utf-8";
            body = JSON.stringify(body);
        }
    } else if (body !== void 0) {
        headers["Content-Type"] = "text/plain; charset=utf-8";
        body = String(body);
    }

    const trace: { stack?: string; } = {};
    Error.captureStackTrace(trace);

    const res = await fetch(url, { method, headers, body });
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
