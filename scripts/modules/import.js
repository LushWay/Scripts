// Functions for registering X-API modules
import { m, mm } from "../lib/Class/Module.js";

/**
 * Common server modules:
 */
m`Server`;
m`Admin`;
m`DatabaseView`;
m`HelpCommand`;
m`Chat`;
mm("OnJoin", { fileName: "join" });
m`Menu`;

/**
 * Gameplay modules
 */
m`Indicator`;
// m`Battle Royal`;
// m`Airdrops`;

/**
 * Development modules:
 */
m`Test`;
m`GameTest`;
// m`Leaderboards`;
mm("World Edit", { fileName: "WBindex" });

m`Objectives`;
