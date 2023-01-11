// Class for register X-API module
import { m, mm } from "../lib/Module/creator.js";

m`DatabaseView`;
m`HelpCommand`;
m`Menu`;
m`Region`;
m`test`;
// m`Battle Royal`;
m`Server`;
// mm(`Server/commands`, { fileName: "import" });
mm(`Server`, { fileName: "pvp" });

m`Chat`;
m`Modding`;
// m`Debug`;
mm("OnJoin", { fileName: "join" });
mm("World Edit", { fileName: "WBindex" });
m`GameTest`;

if (false) {
	m`Debug`;
	m`Leaderboards`;
	m`Airdrops`;
	m`Chest GUI/src`;
	m`migrate`;
}
