import { IS, XA } from "xapi.js";
import { Shape } from "../../modules/builders/ShapeBuilder.js";
//import { WorldEditBuild } from "../../modules/builders/WorldEditBuilder.js";
import { SHAPES } from "../../modules/utils/shapes.js";
new XA.Command({
    type: "wb",
    name: "hsphere",
    description: "Generates a hollow sphere.",
    requires: (p) => IS(p.id, "moderator"),
}).executes((ctx) => {
    const blocks = ctx.args[0]?.split(",");
    const size = parseInt(ctx.args[1]);
    if (!blocks)
        return ctx.reply("§c" + blocks);
    if (!size)
        return ctx.reply("§c" + size);
    const location = {
        x: ctx.sender.location.x,
        y: ctx.sender.location.y,
        z: ctx.sender.location.z,
    };
    new Shape(SHAPES.sphere, location, blocks, size);
    ctx.reply(`Generated a Hollow Sphere at ${location.x} ${location.y}${location.z}`);
});
