import { setPlayerInterval, setTickInterval, XA } from "xapi.js";

const Opts = XA.WorldOptions("debug", {
	enabled: { value: true, desc: "Включает режим отладки" },
	chestGUI: { desc: "", value: true },
});
if (Opts.enabled) {
	const getPLayerSettings = XA.PlayerOptions("debug", {
		tags: { value: true, desc: "Включает режим отладки тэгов" },
	});

	/** @type {Set<string>} */
	const allTags = new Set();

	setPlayerInterval(
		(player) => {
			const settings = getPLayerSettings(player);
			if (!settings.tags) return;

			player.getTags().forEach((tag) => allTags.add(tag));
			const tags = player.getTags();
			const arr = [...allTags.values()].map((el) => (tags.includes(el) ? `§f${el}` : `§8${el}`));
			let string = arr.shift();

			for (let i = 0; i < arr.length; i++) {
				if (i % 5 === 0 && i !== 0) string += `\n§r`;
				else string += `, §r`;

				const tag = arr[i];
				string += tag;
			}
			player.onScreenDisplay.setActionBar(string ?? " ");
		},
		0,
		"debug"
	);
}

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
