import { XA } from "xapi.js";
import { WorldEditBuild } from "../../modules/builders/WorldEditBuilder.js";

new XA.Command({
  /*type: "wb"*/
  name: "undo",
  description: "Отменяет последнее действие (из памяти)",
  requires: (p) => p.hasTag("commands"),
})
  .int("undoCount")
  .executes((ctx, r) => {
    const command = WorldEditBuild.undo(r);
    ctx.reply(command.data.statusMessage);
  });
