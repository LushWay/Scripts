import {
  BlockLocation,
  BlockType,
  MinecraftBlockTypes,
} from "@minecraft/server";
import { SA } from "../../../../index.js";
import { XA } from "xapi.js";
import { spawn } from "../../modules/builders/ShapeBuilder.js";
import { WorldEditBuild } from "../../modules/builders/WorldEditBuilder.js";
//import { SHAPES } from "../../modules/definitions/shapes.js";
import { Cuboid } from "../../modules/utils/Cuboid.js";

/**
 * Caculates average time it will take to complete fill
 * @param {BlockLocation} pos1
 * @param {BlockLocation} pos2
 * @returns {number}
 */
function timeCaculation(pos1, pos2) {
  const cube = new Cuboid(pos1, pos2);
  const timeForEachFill = 3;
  const fillSize = 32768;
  return Math.round((cube.blocksBetween / fillSize) * timeForEachFill * 0.05);
}

new XA.Command({
  name: "set",
  description: "Частично или полностью заполняет блоки в выделенной области",
  tags: ["commands"],
})
  .addOption("block", "string")
  .addOption("blockData", "int", "", true)
  .addOption("destroyHollowKeepOutlineReplace", "string", "", true)
  .addOption("replaceBlock", "string", "", true)
  .addOption("replaceBlockData", "string", "", true)
  .executes((ctx, { block, blockData, replaceBlock }) => {
    if (block != "spawn") {
      //if (!Object.keys(MinecraftBlockTypes).find((e) => e.id == 'minecraft:' + block)) return ctx.invalidArg(block)
      //if (replaceBlock && !Object.keys(MinecraftBlockTypes).find((e) => e.id == 'minecraft:' + replaceBlock)) return ctx.invalidArg(replaceBlock)
      const time = timeCaculation(WorldEditBuild.pos1, WorldEditBuild.pos2);
      if (time >= 0.01)
        ctx.reply(
          `§9► §rНачато заполнение, которое будет закончено приблизительно через ${time} сек`
        );
      WorldEditBuild.fillBetween(
        ctx.args[0],
        ctx.args[1],
        ctx.args[2],
        ctx.args[3],
        ctx.args[4]
      ).then((result) => ctx.reply(result.data.statusMessage));
    } else {
      const p = WorldEditBuild.getPoses();
      new spawn(p.p1.x, p.p1.z, p.p2.x, p.p2.z, blockData ? false : true);
      const a = blockData ? "§aдобавлена" : "§cудалена";
      ctx.reply("§a► §rЗона спавна " + a);
    }
  });
