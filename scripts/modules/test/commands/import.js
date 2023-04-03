import { multiload } from "../../../lib/Class/Module.js";

const Commands = ["particle", "sound", "tool"];

multiload(
	(f) => import(`./${f}.js`),
	Commands.map((e) => [e, e]),
	"ServerCommands"
);
