import { world } from "@minecraft/server";
import { setTickInterval } from "xapi.js";
import { PlayerOption, po, wo, WorldOption } from "../../lib/Class/XOptions.js";

new WorldOption("debug:enable", "Включает режим отладки (нужен /reload)", false);
if (wo.Q("debug:enable")) {
	new PlayerOption("debug:enable", "Включает режим отладки тегов (on_ground и тд)", 0, true);
}
let arro = [];

setTickInterval(
	() => {
		for (const pl of world.getPlayers()) {
			//if(!po.Q('debug:enable', pl)) continue
			if (po.Q("debug:enable", pl)) {
				for (let tag of pl.getTags()) {
					if (arro.includes(tag)) continue;
					if (tag.match(/[0-9]|cooldown|owner|:|Seen|commands/g)) continue;
					arro.push(tag);
				}
				let arr = [];
				let tags = pl.getTags();
				arro.map((el) => arr.push(tags.includes(el) ? `§f${el}` : `§8${el}`));
				let count = 0;
				let has = false;
				let string = "";
				for (let tag of arr) {
					count++;
					if (count > 5) {
						string = string + "\n" + tag;
						count = 0;
					} else {
						has ? (string = string + ", §r" + tag) : (string = tag);
						has = true;
					}
				}
				pl.onScreenDisplay.setActionBar(string ?? " ");
			}
		}
	},
	0,
	"debug"
);

// setTickInterval(() => {
//   for (const e of world.getDimension("overworld").getEntities()) {
//     if (e.id != "f:t" || !e.nameTag.startsWith("tags: ")) continue;
//     const pl = XA.Entity.getClosetsEntitys(e)[0];
//     for (let tag of pl.getTags()) {
//       if (arro.includes(tag)) continue;
//       if (tag.match(/[0-9]|cooldown|owner|Seen|commands/g)) continue;
//       arro.push(tag);
//     }
//     let arr = [];
//     let tags = pl.getTags();
//     arro.map((el) => arr.push(tags.includes(el) ? `§f${el}` : `§8${el}`));
//     let count = 0
//     let has = false
//     let string = ''
//     for (let tag of arr) {
//       count++
//       if (count > 3) {
//         string = string + '\n' + tag
//         count = 0
//       } else {
//         has ? string = string + ', §r' + tag : string = tag
//         has = true
//       }
//     }
//     e.nameTag = `tags: ${string}`;
//   }
// });
