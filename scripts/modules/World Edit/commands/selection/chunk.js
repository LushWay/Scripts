import { XA } from "xapi.js";
import { SelectionBuild } from "../../modules/builders/SelectionBuilder.js";

new XA.Command({
  /*type: "wb"*/
  name: "chunk",
  description: "Set the selection to your current chunk.",
  requires: (p) => p.hasTag("commands"),
}).executes((ctx) => {
  const chunkBorder = XA.Entity.getChunkCuboidPositions(ctx.sender);
  SelectionBuild.setPos1(
    chunkBorder.pos1.x,
    chunkBorder.pos1.y,
    chunkBorder.pos1.z
  );
  SelectionBuild.setPos2(
    chunkBorder.pos2.x,
    chunkBorder.pos2.y,
    chunkBorder.pos2.z
  );
  ctx.reply(
    `§9►§rВыделенна зона: §5Позиция 1§r: ${chunkBorder.pos1.x} ${chunkBorder.pos1.y} ${chunkBorder.pos1.z}, §dПозиция 2§r: ${chunkBorder.pos2.x} ${chunkBorder.pos2.y} ${chunkBorder.pos2.z}`
  );
});
