import { multiload } from "../../../lib/Module/loader.js";

const Commands = ["lore", "id"];

multiload(
	(f) => import(`./${f}.js`),
	Commands.map((e) => [e, e]),
	"ServerCommands"
);
