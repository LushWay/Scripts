import { SA } from "../../../../index.js";
import { XA } from "xapi.js";
import { SelectionBuild } from "../../modules/builders/SelectionBuilder.js";
//import { WorldEditBuild } from "../../modules/builders/WorldEditBuilder.js";

new XA.Command({
  name: "pos2",
  aliases: ["p2"],
  description: "Устанавливает позицию 2 (использовать)",
  tags: ["commands"],
})
  .addOption("pos", "location", "", true)
  .executes((ctx) => {
    const pos = SA.Utilities.format.parseLocationAugs(
      [
        ctx.args[0] ?? String(Math.floor(ctx.sender.location.x)),
        ctx.args[1] ?? String(Math.floor(ctx.sender.location.y)),
        ctx.args[2] ?? String(Math.floor(ctx.sender.location.z)),
      ],
      {
        location: [
          ctx.sender.location.x,
          ctx.sender.location.y,
          ctx.sender.location.z,
        ],
        viewVector: [
          ctx.sender.viewVector.x,
          ctx.sender.viewVector.y,
          ctx.sender.viewVector.z,
        ],
      }
    );
    if (!pos)
      return ctx.reply(`Ввведенные координаты должны выглядеть как: x yф z`);
    SelectionBuild.setPos2(pos.x, pos.y, pos.z);
    ctx.reply(`§d►§r (2) ${pos.x}, ${pos.y}, ${pos.z}`);
  });
