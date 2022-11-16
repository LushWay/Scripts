import { ThrowError, XA } from "xapi.js";
import { world } from "@minecraft/server";

/** @type {"build" | "survival"} */
const logic = new XA.instantDB(world, "basic").get("server.logic");

if (logic === "build") import("./Logic/build.js");
else if (logic === "survival") import("./Logic/survival.js");
else ThrowError(new TypeError("Invalid logic: " + logic));
