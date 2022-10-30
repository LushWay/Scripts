import { SA } from "../../../../index.js";
import { WorldEditBuild } from "../../modules/builders/WorldEditBuilder.js";

new XA.Command(
  {
    type: "wb",
    type: "wb",
    name: "redo",
    description: "Возвращает последнее действие (из памяти)",
    args: "redoCount",
    tags: ["commands"],
  },
  (ctx) => {
    const command = WorldEditBuild.redo(ctx.args[0]);
    ctx.reply(command.data.statusMessage);
  }
);
