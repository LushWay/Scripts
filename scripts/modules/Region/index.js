import { world } from "@minecraft/server";
import { ThrowError, XA } from "xapi.js";

/** @type {"build" | "survival"} */
const logic = new XA.instantDB(world, "basic").get("server.logic") ?? "build";

if (logic === "build") import("./Build/build.js");
else if (logic === "survival") import("./Survival/survival.js");
else ThrowError(new TypeError("Invalid logic: " + logic));
