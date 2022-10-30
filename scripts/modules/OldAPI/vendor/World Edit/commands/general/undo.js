import { SA } from "../../../../index.js";
import { WorldEditBuild } from "../../modules/builders/WorldEditBuilder.js";

new XA.Command(
  {
    type: "wb",
    name: "undo",
    description: "Отменяет последнее действие (из памяти)",
    args: "undoCount",
    tags: ["commands"],
  },
  (ctx) => {
    const command = WorldEditBuild.undo(ctx.args[0]);
    ctx.reply(command.data.statusMessage);
  }
);
