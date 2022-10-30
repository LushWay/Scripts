import { SA } from "../../../../index.js";
import { XA } from "xapi.js";
import { WorldEditBuild } from "../../modules/builders/WorldEditBuilder.js";

new XA.Command(
  {
    type: "wb",
    name: "copy",
    description: "Копирует зону",
    tags: ["commands"],
    type: "wb",
  },
  (ctx) => {
    const command = WorldEditBuild.copy();
    ctx.reply(command.data.statusMessage);
  }
);
