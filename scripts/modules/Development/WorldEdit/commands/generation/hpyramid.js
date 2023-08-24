import { Shape } from "../../builders/ShapeBuilder.js";
//import { WorldEditBuild } from "../../modules/builders/WorldEditBuilder.js";
import { SHAPES } from "../../utils/shapes.js";

new XCommand({
	type: "we",
	name: "hpyramid",
	description: "Generate a hollow pyramid",
	role: "moderator",
}).executes((ctx) => {
	const blocks = ctx.args[0]?.split(",");
	const size = parseInt(ctx.args[1]);
	if (!blocks) return ctx.reply("§c" + blocks);
	if (!size) return ctx.reply("§c" + size);
	const location = {
		x: ctx.sender.location.x,
		y: ctx.sender.location.y,
		z: ctx.sender.location.z,
	};
	new Shape(SHAPES.square_pyramid, location, blocks, size);
	ctx.reply(
		`Generated a Hollow Pyramid at ${location.x} ${location.y}${location.z}`
	);
});
