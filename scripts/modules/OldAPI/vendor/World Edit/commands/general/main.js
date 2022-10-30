import { SA } from "../../../../index.js";
import { configuration } from "../../config.js";

const WECommand = new XA.Command(
  {
    type: "wb",
    type: "wb",
    name: "worldedit",
    description: "WorldEdit commands",
    aliases: ["we"],
    tags: ["commands"],
  },
  (ctx) => {}
);

WECommand.addSubCommand(
  {
    name: "version",
    description: "Get WorldEdit version",
    aliases: ["ver"],
  },
  (ctx) => {
    ctx.reply(`Current World Edit Version: ${configuration.VERSION}`);
  }
);
