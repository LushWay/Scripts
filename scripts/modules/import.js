// Class for register X-API module
import { m, mm } from "../lib/Module/creator.js";

m`DatabaseView`;
m`HelpCommand`;
m`Menu`;
m`Region`;
m`Test`;
// m`Server`;

m`Chat`;
m`Admin`;
mm("OnJoin", { fileName: "join" });
// mm("World Edit", { fileName: "WBindex" });
// m`GameTest`;
// m`Leaderboards`;

if (false) {
	m`Battle Royal`;
	m`Debug`;
	m`Airdrops`;
	m`Chest GUI/src`;
	m`migrate`;
}
