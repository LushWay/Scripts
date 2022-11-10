import { XA } from "xapi.js";

import { SelectionBuild } from "../../modules/builders/SelectionBuilder.js";
///import { WorldEditBuild } from "../../modules/builders/WorldEditBuilder.js";

new XA.Command({
  /*type: "wb"*/
  name: "hpos2",
  description: "Set position 2 to targeted block",
  requires: (p) => p.hasTag("commands"),
}).executes((ctx) => {
  const pos = ctx.sender.getBlockFromViewVector().location;
  SelectionBuild.setPos2(pos.x, pos.y, pos.z);
  ctx.reply(`§dПозиция§r 2 теперь ${pos.x}, ${pos.y}, ${pos.z}`);
});
