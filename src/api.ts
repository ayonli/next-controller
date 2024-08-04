import { applyMagic } from "js-magic";
import type { Constructor } from "@ayonli/jsext";
import ApiController from "./ApiController";

const api = <T extends Constructor<any>>(target: T, ..._: any[]) => {
    // @ts-ignore
    target["__invoke"] ||= ApiController.__invoke;
    return applyMagic(target);
};

export default api;
