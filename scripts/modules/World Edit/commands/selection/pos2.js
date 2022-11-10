import { XA } from "xapi.js";
import { SelectionBuild } from "../../modules/builders/SelectionBuilder.js";

new XA.Command({
  name: "pos2",
  aliases: ["p2"],
  description: "Устанавливает позицию 2 (использовать)",
  requires: (p) => p.hasTag("commands"),
})
  .location("pos", true)
  .executes((ctx, pos) => {
    SelectionBuild.setPos2(pos.x, pos.y, pos.z);
    ctx.reply(`§d►§r (2) ${pos.x}, ${pos.y}, ${pos.z}`);
  });
