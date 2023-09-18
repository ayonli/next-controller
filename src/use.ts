import { Middleware, _middleware } from "./ApiController";

export type FunctionDecorator = {
    <T>(target: any, prop: string, desc: TypedPropertyDescriptor<T>): void | TypedPropertyDescriptor<T>;
    <F extends (...args: any[]) => any>(target: F): void | F;
    <F extends (...args: any[]) => any>(target: F, context: any): void | F;
};

export default function use(
    middleware: Middleware
) {
    return ((proto: any, prop: any, desc: TypedPropertyDescriptor<any> | undefined = undefined) => {
        let method: Function | undefined;

        if (typeof prop === "object" && prop) { // ES decorator
            const ctx = prop as {
                kind?: string;
                name?: string;
            };

            if (ctx.kind !== "method") {
                throw new TypeError("@use can only be used on a method");
            } else if (typeof ctx.name !== "string") {
                throw new TypeError("@use can only be used on a string method name");
            } else {
                method = proto;
            }
        } else if (desc) { // TS experimental decorator
            if (typeof desc.value !== "function") {
                throw new TypeError("@use can only be used on a method");
            }

            if (typeof prop !== "string") {
                throw new TypeError("@use can only be used on a string method name");
            } else {
                method = proto[prop];
            }
        }

        if (!method) {
            throw new TypeError("@use can only be used on a method");
        }

        type Container = Middleware[];
        const container: Container = ((method as any)[_middleware] ||= []);

        container.push(middleware);
    }) as FunctionDecorator;
}
