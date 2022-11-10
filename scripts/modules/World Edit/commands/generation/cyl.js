import { BlockLocation } from "@minecraft/server";
import { XA } from "xapi.js";
import { Shape } from "../../modules/builders/ShapeBuilder.js";
//import { WorldEditBuild } from "../../modules/builders/WorldEditBuilder.js";
import { SHAPES } from "../../modules/definitions/shapes.js";

new XA.Command({
  /*type: "wb"*/
  name: "cyl",
  description: "Generates a cylinder.",
  requires: (p) => p.hasTag("commands"),
}).executes((ctx) => {
  const blocks = ctx.args[0]?.split(",");
  const size = parseInt(ctx.args[1]);
  if (!blocks) return ctx.reply("§c" + blocks);
  if (!size) return ctx.reply("§c" + size);
  const location = new BlockLocation(
    ctx.sender.location.x,
    ctx.sender.location.y,
    ctx.sender.location.z
  );
  new Shape(SHAPES.cylinder_y, location, blocks, size);
  ctx.reply(`Generated a Cylinder at ${location.x} ${location.y}${location.z}`);
});
