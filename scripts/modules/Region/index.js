import { getServerType } from "./var.js";

const type = getServerType();

if (type === "build") import("./Build/index.js");
else if (type === "survival") import("./Survival/index.js");


