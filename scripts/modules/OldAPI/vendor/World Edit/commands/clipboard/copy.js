import { XA } from "xapi.js";
import { WorldEditBuild } from "../../modules/builders/WorldEditBuilder.js";

new XA.Command({
  /*type: "wb"*/
  name: "copy",
  description: "Копирует зону",
  requires: (p) => p.hasTag("commands"),
  /*type: "wb"*/
}).executes((ctx) => {
  const command = WorldEditBuild.copy();
  ctx.reply(command.data.statusMessage);
});
