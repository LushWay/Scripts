import { XA } from "../../../../../../xapi.js";
import { SA } from "../../../../index.js";
import { SelectionBuild } from "../../modules/builders/SelectionBuilder.js";
//import { WorldEditBuild } from "../../modules/builders/WorldEditBuilder.js";

new XA.Command({
  /*type: "wb"*/
  name: "size",
  description: "Получет информация о выделенной зоне",
  requires: (p) => p.hasTag("commands"),
}).executes((ctx) => {
  ctx.reply(`В выделенной зоне ${SelectionBuild.count()} блоков`);
});
