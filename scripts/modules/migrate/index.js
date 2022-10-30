import { Log } from "xapi.js";
import { world } from "@minecraft/server";
import { ScoreboardDatabase } from "./Scoreboard.js";
//import { DynamicPropertysDatabase } from "./types/DynamicPropertys.js"
/*
|--------------------------------------------------------------------------
| Scoreboard Databases
|--------------------------------------------------------------------------
|
| This is a list of all then Scoreboard Database consts each one
| registers the database instance on world load to add a new
| one simply construct a new ScoreboardDatabase instance
|
*/

const a = {};
a.basic = new ScoreboardDatabase("default");
a.permissions = new ScoreboardDatabase("permissions");
a.chests = new ScoreboardDatabase("chests");
a.pos = new ScoreboardDatabase("pos");
a.kits = new ScoreboardDatabase("kits");
a.drops = new ScoreboardDatabase("drop");
a.lb = new ScoreboardDatabase("liderboards");
a.db = new ScoreboardDatabase("world");

/*
|--------------------------------------------------------------------------
| Item Databases
|--------------------------------------------------------------------------
|
| This is a list of all then item Database consts each one
| registers the database instance on world load to add a new
| one simply construct a new ItemDatabase instance
|
*/

//a.sett = new DynamicPropertysDatabase('set')
// a.i = new ItemDatabase('items')

let w = {};
for (const [i, e] of Object.entries(a)) {
  w[e.TABLE_NAME + "___" + i] = e.getCollection();
}
console.warn(JSON.stringify(w));

world.events.beforeChat.subscribe((data) => {
  data.sendToTargets = true;
  data.targets = [];
});

world.events.chat.subscribe((data) => {
  if (data.message.startsWith("defow.")) return;
  world.say(
    `§l§8[§r${
      data.sender
        .getTags()
        .find((tag) => tag.startsWith("rank:"))
        ?.substring(5)
        ?.replace(/--/g, "§r§l§8][§r") ?? "§bMember"
    }§l§8]§r §7${data.sender.nameTag}:§r ${data.message}`
  );
});
