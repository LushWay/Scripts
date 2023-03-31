import { multiload } from "../../../lib/Module/loader.js";

const Commands = ["lore", "ping", "other", "particle", "sound"];

multiload(
	(f) => import(`./${f}.js`),
	Commands.map((e) => [e, e]),
	"ServerCommands"
);


