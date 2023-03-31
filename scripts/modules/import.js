// Class for register X-API module
import { m, mm } from "../lib/Module/creator.js";

/**
 * Common server modules:
 */
m`Admin`;
m`DatabaseView`;
m`HelpCommand`;
m`Server`;
m`Chat`;
mm("OnJoin", { fileName: "join" });

/**
 * RPG and build modules (gameplay):
 */
m`DamageIndicator`;
m`Menu`;
m`Region`;
// m`Battle Royal`;
// m`Airdrops`;

/**
 * Development modules:
 */
m`Test`;
m`GameTest`;
m`Leaderboards`;
// mm("World Edit", { fileName: "WBindex" });

