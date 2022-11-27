import { world } from "@minecraft/server";
import { ThrowError, XA } from "xapi.js";

const key = "server.logic";
const DB = new XA.instantDB(world, "basic");

/** @type {"build" | "survival"} */
const logic =
	DB.get(key) ??
	(() => {
		DB.set(key, "build");
		return "build";
	})();

if (logic === "build") import("./Build/index.js");
else if (logic === "survival") import("./Survival/index.js");
else {
	DB.set(key, "build");
	ThrowError(new TypeError("Invalid logic: " + logic));
}
