import { IS, XA } from "xapi.js";
import { spawn } from "../../modules/builders/ShapeBuilder.js";
import { WorldEditBuild } from "../../modules/builders/WorldEditBuilder.js";
//import { SHAPES } from "../../modules/definitions/shapes.js";
import { Cuboid } from "../../modules/utils/Cuboid.js";

/**
 * Caculates average time it will take to complete fill
 * @param {{x: number; y: number, z: number}} pos1
 * @param {{x: number; y: number, z: number}} pos2
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
	requires: (p) => IS(p.id, "moderator"),
})
	.string("block")
	.int("data", true)
	.array("mode", ["destroy", "hollow", "keep", "outline", "replace"], true)
	.string("other", true)
	.int("otherData", true)
	.executes((ctx, block, blockData, mode, other, otherData) => {
		if (block != "spawn") {
			//if (!Object.keys(MinecraftBlockTypes).find((e) => e.id == 'minecraft:' + block)) return ctx.reply("§c"+block)
			//if (replaceBlock && !Object.keys(MinecraftBlockTypes).find((e) => e.id == 'minecraft:' + replaceBlock)) return ctx.reply("§c"+replaceBlock)
			const time = timeCaculation(WorldEditBuild.pos1, WorldEditBuild.pos2);
			if (time >= 0.01) ctx.reply(`§9► §rНачато заполнение, которое будет закончено приблизительно через ${time} сек`);
			WorldEditBuild.fillBetween(block, blockData, mode, other, otherData).then((result) =>
				ctx.reply(result.data.statusMessage)
			);
		} else {
			const p = WorldEditBuild.getPoses();
			new spawn(p.p1.x, p.p1.z, p.p2.x, p.p2.z, blockData ? false : true);
			const a = blockData ? "§aдобавлена" : "§cудалена";
			ctx.reply("§a► §rЗона спавна " + a);
		}
	});
