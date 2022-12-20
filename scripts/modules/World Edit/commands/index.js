import { multiload } from "../../../lib/Module/loader.js";

const modules = {
	brush: ["brush", "custom items"],
	general: ["undo", "redo", "drawsel", "id", "item"],
	selection: ["pos1", "pos2", "hpos1", "hpos2", "chunk", "wand", "expand", "size"],
	region: ["set"],
	clipboard: ["copy", "paste"],
	generation: ["hcyl", "cyl", "hpyramid", "pyramid", "hsphere", "sphere"],
	tool: ["tool"],
};

/** @type {[string, string][]} */
const all = [];
for (const type in modules) {
	for (const module of modules[type]) all.push([`${type}/${module}`, module]);
}

multiload((f) => import("./" + f + ".js"), all, "WB Commands");
