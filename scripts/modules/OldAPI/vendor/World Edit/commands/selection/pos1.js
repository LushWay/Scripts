import { SA } from "../../../../index.js";
import { XA } from "xapi.js";
import { SelectionBuild } from "../../modules/builders/SelectionBuilder.js";
//import { WorldEditBuild } from "../../modules/builders/WorldEditBuilder.js";

new XA.Command({
  name: "pos1",
  aliases: ["p1"],
  description: "Set position 1",
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
      return ctx.reply(`Ввведенные координаты должны выглядеть как: x, y, z`);
    SelectionBuild.setPos1(pos.x, pos.y, pos.z);
    ctx.reply(`§5►§r (1) ${pos.x}, ${pos.y}, ${pos.z}`);
    const a = [];
    a.toString();
  });
