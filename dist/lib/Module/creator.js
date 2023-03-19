import { __MODULES__ } from "./loader.js";
export class Module {
    /**
     *
     * @param {string} folderName
     * @param {IModuleOptions} [options]
     */
    constructor(folderName, options = {}) {
        this.folder = folderName;
        this.path = options.folderPath ?? "./modules/";
        this.file = options.fileName ?? "index";
        __MODULES__[this.path + this.folder + "/" + this.file + ".js"] = folderName;
    }
}
/**
 * It takes a module name, and registers a it as new module
 * @param {TemplateStringsArray} name - The name of the module.
 */
export const m = (name) => new Module(name[0]);
/**
 * > It creates a new module with the given name and options
 * @param {string} name - The name of the module.
 * @param {IModuleOptions} options - Options of module
 */
export const mm = (name, options) => new Module(name, options);
