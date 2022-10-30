import { SA } from "../../../../index.js";
import { SelectionBuild } from "../../modules/builders/SelectionBuilder.js";
//import { WorldEditBuild } from "../../modules/builders/WorldEditBuilder.js";

new XA.Command(
  {
    type: "wb",
    name: "size",
    description: "Получет информация о выделенной зоне",
    tags: ["commands"],
  },
  (ctx) => {
    ctx.reply(`В выделенной зоне ${SelectionBuild.count()} блоков`);
  }
);
