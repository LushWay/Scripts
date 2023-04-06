import { DisplayError } from "../../../../xapi.js";

try {
	import("./particle.js");
	import("./sound.js");
	import("./tool.js");
} catch (e) {
	DisplayError(e, { errorName: "SubLoadError" });
}
