//import { Items, ItemStack } from "@minecraft/server";
import { XA } from "xapi.js";

new XA.Command({
  /*type: "wb"*/
  name: "tool",
  description: "Gives a tool item in your inventory",
  requires: (p) => p.hasTag("commands"),
}).executes((ctx) => {
  ctx.sender.runCommand("give @s we:tool");
});
