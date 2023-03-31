import {
	MinecraftBlockTypes,
	Player,
	Vector,
	system,
	world,
} from "@minecraft/server";
import { XA } from "xapi.js";
import { CommandContext } from "../../../lib/Command/Context.js";

const lang = {
	nobase:
		"§cДля создания базы поставьте сундук, встаньте на него и напишите §f-base",
	/**
	 *
	 * @param {CommandContext} ctx
	 * @returns
	 */
	inpvp(ctx) {
		if (XA.Entity.getScore(ctx.sender, "pvp") > 0) {
			ctx.reply(
				"§4► §cПодождите еще §6" +
					XA.Entity.getScore(ctx.sender, "pvp") +
					" сек"
			);
			return true;
		}
	},
};

/*
|--------------------------------------------------------------------------
* -base
|--------------------------------------------------------------------------
|
TODO: Список доступных функций 
| 
| 
*/
const base = new XA.Command({
	name: "base",
	description: "Встаньте на сундук и запустите это, что бы создать базу",
});
base.executes((ctx) => {
	if (lang.inpvp(ctx)) return;

	const db = XA.tables.basic;

	/** @type {[number, number, number,]} */
	const basepos = db.get("basepos");

	if (basepos?.map) {
		const bl = { x: basepos[0], y: basepos[1], z: basepos[2] };
		let ent = world
			.getDimension("overworld")
			?.getEntitiesAtBlockLocation(bl)
			?.find((e) => e.typeId == "s:base");

		if (ent) {
			return ctx.reply(
				"§7Доступные действия с базой на §6" +
					basepos.join(", ") +
					":\n§f  -base add - §o§7Добавить игрока. §fИгрок должен встать рядом с базой, а затем вы должны прописать это.§r" +
					"\n§f  -base remove <Имя игрока> - §o§7Удалить игрока.§r" +
					"\n§f  -base list - §o§7Список баз, в которые вы добавлены.§r" +
					"\n§7Что бы убрать базу, сломай бочку.§r"
			);
		} else db.delete("basepos");
	}
	if (XA.Entity.getScore(ctx.sender, "inv") == 1)
		return ctx.reply("§cБазу можно поставить только на анархии");

	const block = ctx.sender.dimension.getBlock(
		Vector.floor(ctx.sender.location)
	);

	if (block.typeId !== "minecraft:chest") return ctx.reply(lang.nobase);

	if (
		XA.Entity.getClosetsEntitys(ctx.sender, 30, "s:base", 1, false).length > 1
	)
		return ctx.reply("§cРядом есть другие базы");

	block.setType(MinecraftBlockTypes.barrel);
	const entity = block.dimension.spawnEntity("s:base", block.location);

	db.set("basepos", [block.location.x, block.location.y, block.location.z]);
	ctx.reply(
		"§7  База успешно зарегистрированна!\n\n  Теперь взаимодействовать с блоками в радиусе 20 блоков от базы можете только вы и добавленные пользователи(добавить: §f-base add§7)\n\n  Из блока базы (бочки) каждый час будет удалятся несколько предметов. Если в базе не будет никаких ресурсов, приват перестанет работать.§r"
	);
});
base
	.literal({ name: "add", description: "Добавляет игрока" })
	.executes((ctx) => {
		if (lang.inpvp(ctx)) return;

		const db = XA.tables.basic;

		/** @type {[number, number, number,]} */
		const basepos = db.get("basepos");

		if (!basepos?.map) return ctx.reply(lang.nobase);
		const bl = { x: basepos[0], y: basepos[1], z: basepos[2] };
		let ent = world
			.getDimension("overworld")
			?.getEntitiesAtBlockLocation(bl)
			?.find((e) => e.typeId == "s:base");

		if (!ent) {
			XA.Entity.removeTagsStartsWith(ctx.sender, "base: ");
			return ctx.reply(lang.nobase);
		}
		try {
			ent.runCommandAsync(`testfor @p[name="${ctx.sender.nameTag}",r=20]`);
		} catch (e) {
			return ctx.reply("§сТы слишком далеко от базы! (Вне зоны привата)");
		}
		const pl = XA.Entity.getClosetsEntitys(
			ent,
			1,
			"minecraft:player",
			1,
			false
		).find((e) => e.nameTag != ctx.sender.name);
		if (!(pl instanceof Player))
			return ctx.reply(
				"§сРядом с базой должен стоять игрок, которого вы хотите добавить!"
			);
		ent.nameTag = ent.nameTag + ", " + pl.name;
		ctx.reply(
			`§6${pl.name}§7 добавлен в приват. Теперь там §6${ent.nameTag}§r`
		);
	});
base
	.literal({ name: "remove", description: "Удаляет игрока из базы" })
	.string("player")
	.executes((ctx, player) => {
		if (lang.inpvp(ctx)) return;

		const db = XA.tables.basic;

		/** @type {[number, number, number,]} */
		const basepos = db.get("basepos");

		if (!basepos?.map) return ctx.reply(lang.nobase);
		const bl = { x: basepos[0], y: basepos[1], z: basepos[2] };
		let ent = world
			.getDimension("overworld")
			.getEntitiesAtBlockLocation(bl)
			.find((e) => e.typeId == "s:base");
		if (!ent) {
			XA.Entity.removeTagsStartsWith(ctx.sender, "base: ");
			return ctx.reply(lang.nobase);
		}
		try {
			ent.runCommandAsync(`testfor @p[name="${ctx.sender.nameTag}",r=20]`);
		} catch (e) {
			return ctx.reply("§сТы слишком далеко от базы! (Вне зоны привата)§r");
		}
		const arr = ent.nameTag.split(", ");
		if (!arr.includes(player))
			return ctx.reply(
				`§сИгрока §f${player}§c нет в привате. Там есть только: §f${ent.nameTag}`
			);
		/**
		 * @type {string[]}
		 */
		let arr2 = [];
		arr.forEach((e) => {
			if (e != player) arr2.push(e);
		});
		if (arr2.length < 1)
			return ctx.reply("§cВ привате должен быть хотя бы один игрок.");
		if (player == ctx.sender.nameTag) {
			let igr;
			for (const pl of arr2) {
				if (XA.Entity.fetch(pl)) igr = XA.Entity.fetch(pl);
			}
			if (!igr)
				return ctx.reply(
					"§cПри удалении себя из привата нужно что бы хотя бы один игрок в привате был онлайн."
				);
			igr.addTag("base: " + XA.Entity.getTagStartsWith(ctx.sender, "base: "));
			igr.tell(
				`§7Вам переданы права управления базой на §6${XA.Entity.getTagStartsWith(
					ctx.sender,
					"base: "
				)}`
			);
			XA.Entity.removeTagsStartsWith(ctx.sender, "base: ");
		}
		ent.nameTag = arr2.join(", ");
		ctx.reply(
			`§6${player}§7 удален из в привата. Теперь там §6${ent.nameTag}§r`
		);
	});
base.literal({ name: "list", description: "Список баз" }).executes((ctx) => {
	if (lang.inpvp(ctx)) return;

	const db = XA.tables.basic;

	/** @type {[number, number, number,]} */
	const basepos = db.get("basepos");

	if (!basepos?.map) return ctx.reply(lang.nobase);
	const bl = { x: basepos[0], y: basepos[1], z: basepos[2] };
	let ent = world
		.getDimension("overworld")
		.getEntitiesAtBlockLocation(bl)
		.find((e) => e.typeId == "s:base");
	if (!ent) {
		XA.Entity.removeTagsStartsWith(ctx.sender, "base: ");
		return ctx.reply(lang.nobase);
	}
	try {
		ent.runCommandAsync(`testfor @p[name="${ctx.sender.name}",r=20]`);
	} catch (e) {
		return ctx.reply("§cТы слишком далеко от базы! (Вне зоны привата)");
	}
	ctx.reply(`§7В привате базы есть такие игроки: §6${ent.nameTag}`);
});

system.runInterval(
	() => {
		for (const base of XA.dimensions.overworld.getEntities({
			type: "s:base",
		})) {
			const block = base.dimension.getBlock(Vector.floor(base.location));
			if (block && block.typeId === "minecraft:barrel") continue;

			base.nameTag
				.split(", ")
				// @ts-ignore
				.forEach((e, i, a) =>
					XA.Entity.fetch(e).tell(
						"§cБаза с владельцем §f" + a[0] + "§c разрушена."
					)
				);
			base.triggerEvent("kill");
		}
	},
	"baseInterval",
	10
);

// world.events.blockBreak.subscribe((data) => {
// 	const ent = XA.Entity.getClosetsEntitys(data.player, 20, "s:base", 1, false);
// 	if (ent.length < 1 || ent[0].nameTag.split(", ").includes(data.player.name))
// 		return stats.Bbreak.Eadd(data.player, 1);
// 	data.dimension
// 		.getBlock(data.block.location)
// 		.setPermutation(data.brokenBlockPermutation.clone());
// 	data.player.tell("§cПриват игрока " + ent[0].nameTag.split(", ")[0]);
// 	const bl = data.block.location;
// 	setTickTimeout(() => {
// 		XA.runCommandAsync(`kill @e[type=item,x=${bl.x},z=${bl.z},y=${bl.y},r=2]`);
// 	}, 1);
// });

// world.events.blockPlace.subscribe((data) => {
// 	const ent = XA.Entity.getClosetsEntitys(data.player, 20, "s:base", 1, false);
// 	if (ent.length < 1 || ent[0].nameTag.split(", ").includes(data.player.name))
// 		return stats.Bplace.Eadd(data.player, 1);
// 	const bl = data.block.location;
// 	XA.runCommandAsync(
// 		`fill ${bl.x} ${bl.y} ${bl.z} ${bl.x} ${bl.y} ${bl.z} air 0 destroy`
// 	);
// 	data.player.tell("§cПриват игрока " + ent[0].nameTag.split(", ")[0]);
// 	console.warn(data.block.permutation.getAllProperties());
// });

// world.events.beforeExplosion.subscribe((data) => {
// 	if (!data.impactedBlocks[0]) return;
// 	const e = {},
// 		loc = data.impactedBlocks.find((e) => e && e.x);
// 	e.location = { x: loc.x, y: loc.y, z: loc.z };
// 	const ent = XA.Entity.getClosetsEntitys(e, 20, "s:base", 1, false);
// 	if (ent.length < 1) return;
// 	for (const name of ent[0].nameTag.split(", ")) InRaid[name] = 60;
// });


