import * as qs from "qs";
import isEmpty from "@hyurl/utils/isEmpty";
import HttpException from "./HttpException";

export default function useApi<T extends Function>(path: string, base = ""): T {
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
    const reqHeaders = {};

    if (!isEmpty(query)) {
        url += "?" + qs.stringify(query);
    }

    if (typeof body === "object") {
        if (!(body instanceof FormData)) {
            reqHeaders["Content-Type"] = "application/json; charset=utf-8";
        }
    } else if (body !== void 0) {
        reqHeaders["Content-Type"] = "text/plain; charset=utf-8";
    }

    const res = await fetch(url, {
        method,
        headers: reqHeaders,
        body
    });
    const resHeaders = res.headers;
    const resType: string = resHeaders["Content-Type"]
        || resHeaders["content-type"];

    if (res.status < 400) {
        let returns: any;

        if (resType?.includes("json")) {
            returns = await res.json();
        } else {
            returns = await res.text();
        }

        return returns;
    } else if (res.status === 405) {
        throw new ReferenceError(
            `ApiController.${method.toLowerCase()} is not implemented`);
    } else {
        throw new HttpException(
            res.statusText || (await res.text()) || "Unknown",
            res.status);
    }
}
