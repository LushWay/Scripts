import { SA } from "../../../../index.js";
import { WorldEditBuild } from "../../modules/builders/WorldEditBuilder.js";

new XA.Command(
  {
    type: "wb",
    name: "drawsel",
    description: "Переключает рисование текущего выделения",
    tags: ["commands"],
  },
  (ctx) => {
    WorldEditBuild.drawsel = !WorldEditBuild.drawsel;
    ctx.reply(
      `§c► §fОтображение выделения: ${
        WorldEditBuild.drawsel ? "§aвключено" : "§cвыключено"
      }`
    );
  }
);
