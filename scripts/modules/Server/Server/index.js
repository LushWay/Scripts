import "./commands/gamemode.js";
import "./commands/ping.js";
import "./commands/sit.js";
import "./commands/ws.js";
import { SERVER } from "./var.js";

if (SERVER.type === "build") import("../../Gameplay/Build/index.js");
if (SERVER.type === "survival") import("../../Gameplay/Survival/index.js");
if (SERVER.type === "disabled" || SERVER.type === "unknown") import('./disabled.js')