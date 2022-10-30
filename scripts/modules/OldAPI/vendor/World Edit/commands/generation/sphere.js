import { BlockLocation } from "@minecraft/server";
import { SA } from "../../../../index.js";
import { XA } from "xapi.js";
import { Shape } from "../../modules/builders/ShapeBuilder.js";
//import { WorldEditBuild } from "../../modules/builders/WorldEditBuilder.js";
import { SHAPES } from "../../modules/definitions/shapes.js";

new XA.Command(
  {
    type: "wb",
    name: "sphere",
    description: "Generates a filled sphere.",
    tags: ["commands"],
  },
  (ctx) => {
    const blocks = ctx.args[0]?.split(",");
    const size = parseInt(ctx.args[1]);
    if (!blocks) return ctx.invalidArg(blocks);
    if (!size) return ctx.invalidArg(size);
    const location = new BlockLocation(
      ctx.sender.location.x,
      ctx.sender.location.y,
      ctx.sender.location.z
    );
    new Shape(SHAPES.sphere, location, blocks, size);
    ctx.reply(`Generated a Sphere at ${location.x} ${location.y}${location.z}`);
  }
);
