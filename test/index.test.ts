import { before, after } from "mocha";
import * as http from "http";
import axios from "axios";
import * as fetch from "node-fetch";

global.fetch ??= <any>fetch;
axios.defaults.baseURL = "http://localhost:3000";

let server: http.Server;

before(async () => {
    server = http.createServer(async (req, res) => {
        const { pathname } = new URL(req.url as string, "http://localhost:3000");

        if (pathname.startsWith("/api/")) {
            const { default: Controller } = await import("./pages" + pathname);

            // Call the class as a function.
            Controller.call(void 0, req, res);
        }
    });

    await new Promise(resolve => server.listen(3000, () => resolve(void 0)));
});

after(async () => {
    await new Promise(resolve => {
        server.closeAllConnections?.();
        server.close(() => resolve(void 0));
    });
});
