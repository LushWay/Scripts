import { IS, XA } from "xapi.js";
import { WorldEditBuild } from "../../modules/builders/WorldEditBuilder.js";
new XA.Command({
    type: "wb",
    name: "size",
    description: "Получет информация о выделенной зоне",
    requires: (p) => IS(p.id, "moderator"),
}).executes((ctx) => {
    if (!WorldEditBuild.selectionCuboid)
        return ctx.reply("§cЗона не выделена!");
    ctx.reply(`В выделенной зоне ${XA.Utils.getBlocksCount(WorldEditBuild.pos1, WorldEditBuild.pos2)} блоков`);
});
