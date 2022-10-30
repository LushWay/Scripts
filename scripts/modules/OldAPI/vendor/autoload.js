import { Items } from "@minecraft/server";
import { wo } from "../app/Models/Options.js";

const q = wo.QQ("imports:clean");

/*
|--------------------------------------------------------------------------
| Autoload Plugins
|--------------------------------------------------------------------------
|
| This file is for loading in the plugins that have been imported in
| as these files need to be loaded in my import you need to List the
| import refrence down below leadint to the directors respected index file
| 
*/

const Plugins = [
  "Lmao/index.js",
  "GameTest/index.js",
  "Leaderboards/index.js",
  "Server/index.js",
  "Chat Ranks/index.js",
  "Airdrops/index.js",
  "Chest GUI/src/index.js",
  "Smelly Api/src/index.js",
  "Wallet/money.js",
  "Private/private.js",
];
if (wo.QQ("server:spawn")) Plugins.push("Portals/index.js");
if (!wo.QQ("import:cmd:wb:disable")) Plugins.push("World Edit/WORLDindex.js");
if (wo.QQ("import:br")) Plugins.push("Battle Royal/index.js");
if (Items.get("addon:akm")) Plugins.push("Guns/index.js");

for (const plugin of Plugins) {
  const start = Date.now();
  import(`./${plugin}`)
    .then(() => {
      if (!q)
        console.warn(`§f${plugin.split("/")[0]} (${Date.now() - start} ms)`);
    })
    .catch((error) => {
      console.warn(`§c[E] §f${plugin}: ` + error + error.stack);
    });
}
