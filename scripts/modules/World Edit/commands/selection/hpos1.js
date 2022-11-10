import { XA } from "xapi.js";

import { SelectionBuild } from "../../modules/builders/SelectionBuilder.js";
//import { WorldEditBuild } from "../../modules/builders/WorldEditBuilder.js";

new XA.Command({
  /*type: "wb"*/
  name: "hpos1",
  description: "Set position 1 to targeted block",
  requires: (p) => p.hasTag("commands"),
}).executes((ctx) => {
  const pos = ctx.sender.getBlockFromViewVector().location;
  SelectionBuild.setPos1(pos.x, pos.y, pos.z);
  ctx.reply(`§5Позиция§r 1 теперь ${pos.x}, ${pos.y}, ${pos.z}`);
});
