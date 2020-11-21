# Next-Controller

An api controller wrapper for Next.js framework.

## Why Using This Package?

Next.js has a special way to write API backend logics by exporting a default
function in the files under `pages/api` directory, which follows the React
preference. It's simpler, but headache, we'll have to write all logics inside
one single function, and handing all possible HTTP request methods, which might
not be annoying at first, be it can be a real drawback when our program becomes
big.

So this package is meant to solve this problem, it provides an elegant wrapper
that allows us writing our backend code in a more traditional MVC controller way,
and provides straight forward support of middleware, which is compatible with
the Express framework, so we can use Express middleware directly in Next.js
program.

## Install

### NPM

```sh
npm i next-controller
```

### YARN

```sh
yarn add next-controller
```

## Pre-configuration

To use this package, we will need to configure our project a little bit so that
to support TypeScript decorators. Create a `.babelrc` file in the project's
working directory, and put the following content in it.

```json
{
  "plugins": [
    ["@babel/plugin-proposal-decorators", { "legacy": true }]
  ]
}
```

## Example

Just like usual, will create a TypeScript file in the `pages/api` directory, but
instead of exporting a default function, we export a default class that extends
the `ApiController` base-class and decorate it with `@api` decorator.

```ts
// pages/api/example.ts
import { api, ApiController } from "next-controller";

@api
export default class extends ApiController {
    /** Handles POST request. */
    async post(body: { foo: string }) {
        // The `req` and `res` objects are bound to the controller instance
        // once the request come.
        const { req, res } = this;

        // To response something back to the client, just return it.
        return {
            bar: "Hello, " + body.foo
        };
    }

    /** Handles GET request. */
    async get(query: { foo: string }) {
        // ... All rules are the same as handling a POST request.
        return {
            bar: "Hello, " + query.bar
        };
    }
}
```

## Method Support

All major HTTP request methods are supported in the ApiController, but be aware
that their signatures are different.

```ts
@api
export default class extends ApiController {
    async delete(query: object, body: any): Promise<any>;
    async get(query: object): Promise<any>;
    async head(): Promise<void>;
    async options(query: object): Promise<any>;
    async patch(query: object, body: any): Promise<any>;
    async post(body: any): Promise<any>; // use `this.req.query` to access the query object if must.
    async put(query: object, body: any): Promise<any>;
}
```

Note: all these methods are intended to handle corresponding http request types
straight forward, so their signatures only contain those properties that are
absolutely necessary, for other properties, e.g. `params` (and `query` in post),
must be accessed via the `req` object.

## Middleware Support

In a controller, we can use `useMiddleware()` method or the `@useMiddleware`
decorator to bind middleware.

1. `useMiddleware()`

This method must be used in the constructor of a controller, for example:

```ts
import { api, ApiController } from "next-controller";
import * as expressSession from "express-session";

@api
export default class extends ApiController {
    constructor(req, res) {
        super(req, res);

        this.useMiddleware(expressSession());

        // Unlike traditional express middleware, we can actually wait for
        // the execution of the next middleware, and gets its returning value,
        // for example:
        this.useMiddleware(async (req, res, next) => {
            const returns = await next();
            // ...
        });
    }
}
```

2. `@useMiddleware`

This decorator is used directly on the controller method, for example

```ts
import { api, ApiController } from "next-controller";
import * as multer from "multer";

const upload = multer({ dest: 'uploads/' });

@api
export default class extends ApiController {
    @useMiddleware(upload.single("avatar"))
    async post(body: object) {
        // `this.req.file` will be the `avatar` file.
    }
}
```


Note: if both `useMiddleware()` and `@useMiddleware` are used, their order are
respected as the same order as the above examples'.

## Client-side Support

We can use the controller class as a type in the client-side code in our Next.js
program if we use the utility function `useApi()`, which provides dedicated
transform of api calls and is well typed for IDE intellisense, for example:

```tsx
// pages/example.tsx
import { useState, useEffect } from "react";
import { useApi } from "next-controller";
import type ExampleController from "./api/example";

export default function Example() {
    const {state, setState} = useState<{ bar: string }>(null);

    useEffect(() => {
        (async () => {
            // `useApi` will automatically append `/api/` prefix to the URL,
            // and it will derive the `post()` and the `get()` methods from the
            // `ExampleController` class.
            const data = await useApi<ExampleController>("example").get({
                foo: "World!"
            });

            setState(data);
        })();
    }, []);

    return <p>{state?.bar || "Loading"}</p>;
}
```

## HttpException

If the server responded an HTTP status code that is between `400` - `599`, it is
considered that something went wrong and the request failed, either caused by
the client-side or the server-side, such a situation is represented as an
`HttpException`.

### Server-side Usage

We can directly throw an `HttpException` instance in a controller, and the
framework will automatically report the exception to the client.

```ts
// pages/api/example.ts
import { api, ApiController, HttpException } from "next-controller";

@api
export default class extends ApiController {
    /** Handles POST request. */
    async post(body: { foo: string }) {
        const { req, res } = this;

        if (!passCheck(body)) {
            throw new HttpException("The request body is unrecognized", 400);
        }

        return {
            bar: "Hello, " + body.foo
        };
    }
}
```

### Client-side Usage

We can catch the `HttpException` if using `useApi()` on the client-side.

```tsx
// pages/example.tsx
import { useState, useEffect } from "react";
import { useApi, HttpException } from "next-controller";
import type ExampleController from "./api/example";

export default function Example() {
    const {state, setState} = useState<{ bar: string }>(null);

    useEffect(() => {
        (async () => {
            try {
                const data = await useApi<ExampleController>("example").post({
                    foo: "World!"
                });

                setState(data);
            } catch (err) {
                if (err instanceof HttpException) {
                    alert(`${err.message} (code: ${err.code})`);
                } else {
                    // Other than HttpException, there could be other type of
                    // exceptions during the request, for example, losing
                    // internet connection.
                }
            }
        })();
    }, []);

    return <p>{state?.bar || "Loading"}</p>;
}
```

Note: if the server throw some error other than an HttpException, on the client
side, it will be automatically transferred to an HttpException with code `500`.
