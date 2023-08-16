import { Shape } from "../../builders/ShapeBuilder.js";
import { SHAPES } from "../../utils/shapes.js";

new XCommand({
	type: "wb",
	name: "sphere",
	description: "Generates a filled sphere.",
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
	new Shape(SHAPES.sphere, location, blocks, size);
	ctx.reply(`Generated a Sphere at ${location.x} ${location.y}${location.z}`);
});
