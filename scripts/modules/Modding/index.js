import { multiload } from "../../lib/Module/loader.js";

const modules = ["role"];
multiload(
	(file) => import("./" + file + ".js"),
	modules.map((e) => [e, e]),
	"Modding"
);
