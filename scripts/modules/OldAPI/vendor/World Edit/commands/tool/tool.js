//import { Items, ItemStack } from "@minecraft/server";
import { SA } from "../../../../index.js";
import { XA } from "xapi.js";

new XA.Command(
  {
    type: "wb",
    name: "tool",
    description: "Gives a tool item in your inventory",
    tags: ["commands"],
  },
  (ctx) => {
    ctx.sender.runCommand("give @s we:tool");
  }
);
