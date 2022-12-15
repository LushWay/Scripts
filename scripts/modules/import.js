// Class for register X-API module
import { m, mm } from "../lib/Module/creator.js";

m`DatabaseView`;
m`HelpCommand`;
m`FastReload`;
m`Menu`;
m`Region`;
m`test`;
m`Battle Royal`;
m`Server`;
m`Chat`;
m`Modding`;
mm("OnJoin", { fileName: "join" });
mm("World Edit", {
	fileName: "WBindex",
});

if (false) {
	m`Debug`;
	m`GameTest`;
	m`Leaderboards`;
	m`Airdrops`;
	m`Chest GUI/src`;
	m`migrate`;
}
