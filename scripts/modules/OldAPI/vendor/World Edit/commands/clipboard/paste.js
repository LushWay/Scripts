import { SA } from "../../../../index.js";
import { WorldEditBuild } from "../../modules/builders/WorldEditBuilder.js";

new XA.Command({
  type: "wb",
  name: "paste",
  description: "Вставляет заранее скопированную зону",
  tags: ["commands"],
  type: "wb",
})
  .addOption("rotation", "int", "", true)
  .addOption("mirror", "string", "", true)
  .addOption("includeEntites", "boolean", "", true)
  .addOption("includeBlocks", "boolean", "", true)
  .addOption("integrity", "int", "", true)
  .addOption("seed", "int", "", true)
  .executes(
    (
      ctx,
      { rotation, mirror, includeEntites, includeBlocks, integrity, seed }
    ) => {
      let b, e;
      if (!includeEntites && !includeBlocks) {
        e = false;
        b = true;
      } else {
        b = includeBlocks;
        e = includeEntites;
      }
      const command = WorldEditBuild.paste(
        ctx.sender,
        rotation,
        mirror,
        e,
        b,
        integrity,
        seed
      );
      ctx.reply(command.data.statusMessage);
    }
  );
