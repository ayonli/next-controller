import type { Middleware } from "./ApiController";

export default function use(middleware: Middleware): MethodDecorator {
    return (proto, prop, desc) => {
        if (typeof desc.value !== "function") {
            throw new TypeError("@use can only be used on a method");
        }

        if (typeof prop !== "string") {
            throw new TypeError("@use can only be used on a string method name");
        }

        const ctor = proto.constructor;
        type Container = { [method: string]: Middleware[]; };
        const container: Container = (ctor[Symbol.for("middleware")] ||= {});

        (container[prop] ||= []).push(middleware);
    };
}
