export class Module {
    /**
     *
     * @param {string} folderName
     * @param {IModuleOptions} [options]
     */
    constructor(folderName: string, options?: IModuleOptions);
    folder: string;
    path: any;
    file: any;
}
export function m(name: TemplateStringsArray): Module;
export function mm(name: string, options: IModuleOptions): Module;
