import { XA } from "xapi.js";
import { WorldEditBuild } from "../../modules/builders/WorldEditBuilder.js";
new XA.Command({
  /*type: "wb"*/
  /*type: "wb"*/
  name: "redo",
  description: "Возвращает последнее действие (из памяти)",
  requires: (p) => p.hasTag("commands"),
}).executes((ctx, r) => {
  const command = WorldEditBuild.redo();
  ctx.reply(command.data.statusMessage);
});
