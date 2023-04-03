// @ts-nocheck

setTickInterval(
	() => {
		for (const f of world.overworld.getEntities({
			type: "fireworks_rocket",
		})) {
			if (
				XA.Entity.inRadius(
					// @ts-expect-error
					new Location(...wo.G("spawn:pos").split(" ")),
					XA.Utils.vecToBlockLocation(f.location),
					200
				)
			)
				continue;
			if (
				XA.Entity.inRadius(
					// @ts-expect-error
					new Location(...wo.G("minigames:pos").split(" ")),
					XA.Utils.vecToBlockLocation(f.location),
					50
				)
			)
				continue;
			if (!XA.Entity.getTagStartsWith(f, "l:")) {
				const sender = XA.Entity.getClosetsEntitys(
					f,
					2,
					"minecraft:player",
					1,
					false
				)[0];
				if (sender instanceof Player) {
					const lore = XA.Entity.getHeldItem(sender).getLore()[0];
					if (!lore || lore == "§r§н") continue;
					if (lore == "§r§б") f.addTag("блоки");
					if (lore == "§r§и") f.addTag("игроки");
					stats.fireworksLaunched.eAdd(sender, 1);
					f.addTag("l:" + sender.name);
				}
			}
			const type = f.hasTag("блоки") ? 2 : f.hasTag("игроки") ? 3 : 0;
			if (type == 0) continue;
			if (type == 2) {
				// TODO! Make check function
				if (true) {
					continue;
				} else boom.breaksBlocks = true;
			}

			// if (type == 3)
			// 	try {
			// 		f.runCommandAsync("testforblock ^^^1 air");
			// 		f.runCommandAsync("testforblock ^^^2 air");
			// 		continue;
			// 	} catch (e) {}
			let a = [...world.getPlayers()].find(
				(e) => e.name == XA.Entity.getTagStartsWith(f, "l:")
			);
			if (a) stats.fireworksExpoded.eAdd(a, 1);
			f.dimension.createExplosion(
				{ x: f.location.x, y: f.location.y, z: f.location.z },
				type,
				boom
			);
			f.kill();
			boom.breaksBlocks = false;
		}
	},
	"serverBoomShit",
	0
);
