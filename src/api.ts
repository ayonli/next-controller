import { applyMagic } from "js-magic";
import ApiController from "./ApiController";

const api: ClassDecorator = (target) => {
    target["__invoke"] ||= ApiController.__invoke;
    return applyMagic(target);
};

export default api;
