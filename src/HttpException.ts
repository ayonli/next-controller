import { Exception } from "@ayonli/jsext/error";

export default class HttpException extends Exception {
    constructor(code: number);
    constructor(message: string, code: number);
    constructor(message: string, options: {
        code: number;
        cause?: unknown;
    });
    constructor(status: string | number, code?: number | {
        code: number;
        cause?: unknown;
    }) {
        let message: string;

        if (typeof status === "number") {
            code = status;
            message = HttpStatus[code] || "";
        } else {
            message = status;
        }

        if (typeof code === "number") {
            super(message, code);
        } else if (typeof code === "object") {
            super(message, code);
        }
    }

    static from(err: string | Error) {
        if (err instanceof HttpException) { // make a copy
            const _err = Object.create(HttpException.prototype);

            Object.defineProperties(_err, {
                name: {
                    value: "HttpException",
                    configurable: true,
                    writable: true,
                },
                cause: {
                    value: _err.cause,
                    configurable: true,
                    writable: true,
                },
                code: {
                    value: err.code,
                    configurable: true,
                    writable: true,
                },
                message: {
                    value: err.message,
                    configurable: true,
                    writable: true,
                },
                stack: {
                    value: err.stack,
                    configurable: true,
                    writable: true,
                },
            });

            return _err;
        } else if (err instanceof Error) {
            return new HttpException(err.message, {
                code: 500,
                cause: err,
            });
        } else {
            return new HttpException(String(err), 500);
        }
    }
}

Object.defineProperty(HttpException.prototype, "name", {
    value: "HttpException",
    configurable: true,
    writable: true,
});

export const HttpStatus: { [code: number]: string; } = {
    100: 'Continue',
    101: 'Switching Protocols',
    102: 'Processing',
    103: 'Early Hints',
    200: 'OK',
    201: 'Created',
    202: 'Accepted',
    203: 'Non-Authoritative Information',
    204: 'No Content',
    205: 'Reset Content',
    206: 'Partial Content',
    207: 'Multi-Status',
    208: 'Already Reported',
    226: 'IM Used',
    300: 'Multiple Choices',
    301: 'Moved Permanently',
    302: 'Found',
    303: 'See Other',
    304: 'Not Modified',
    305: 'Use Proxy',
    307: 'Temporary Redirect',
    308: 'Permanent Redirect',
    400: 'Bad Request',
    401: 'Unauthorized',
    402: 'Payment Required',
    403: 'Forbidden',
    404: 'Not Found',
    405: 'Method Not Allowed',
    406: 'Not Acceptable',
    407: 'Proxy Authentication Required',
    408: 'Request Timeout',
    409: 'Conflict',
    410: 'Gone',
    411: 'Length Required',
    412: 'Precondition Failed',
    413: 'Payload Too Large',
    414: 'URI Too Long',
    415: 'Unsupported Media Type',
    416: 'Range Not Satisfiable',
    417: 'Expectation Failed',
    418: "I'm a Teapot",
    421: 'Misdirected Request',
    422: 'Unprocessable Entity',
    423: 'Locked',
    424: 'Failed Dependency',
    425: 'Too Early',
    426: 'Upgrade Required',
    428: 'Precondition Required',
    429: 'Too Many Requests',
    431: 'Request Header Fields Too Large',
    451: 'Unavailable For Legal Reasons',
    500: 'Internal Server Error',
    501: 'Not Implemented',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
    504: 'Gateway Timeout',
    505: 'HTTP Version Not Supported',
    506: 'Variant Also Negotiates',
    507: 'Insufficient Storage',
    508: 'Loop Detected',
    509: 'Bandwidth Limit Exceeded',
    510: 'Not Extended',
    511: 'Network Authentication Required'
};
