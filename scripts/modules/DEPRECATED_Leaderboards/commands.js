import { world } from "@minecraft/server";
import { IS, XA } from "xapi.js";
import { LeaderboardBuild } from "./LeaderboardBuilder.js";
const lb = XA.tables;

const lba = new XA.Command({
	name: "lb",
	aliases: ["leaderboard"],
	description: "Create custom leaderboards that track players data in the world",
	requires: (p) => IS(p.id, "admin"),
	/*type: "serv"*/
});
lba
	.literal({ name: "create" })
	.string("objective")
	.location("location")
	.executes((ctx, objective, location) => {
		if (objective.length > 16 || !/^[a-zA-Z]+$/.test(objective)) return ctx.reply(objective);
		if (lb.has(objective)) return ctx.reply("§сТакая таблица уже существует лол");
		LeaderboardBuild.createLeaderboard(objective, location.x, location.y, location.z, ctx.sender.dimension.id);
		ctx.reply(`§7Таблица §f${objective} §7успешно создана на §6${location.x} ${location.y} ${location.z}`);
		return ctx.sender.playSound(`random.orb`);
	});
lba
	.literal({ name: "remove" })
	.string("objective")
	.location("location")
	.executes((ctx, objective, location) => {
		if (objective.length > 16 || !/^[a-zA-Z]+$/.test(objective)) return ctx.reply(objective);
		const leaderboardData = lb.get(objective);
		if (!leaderboardData) return ctx.reply("§cнет такой " + objective); //§r
		if (leaderboardData.location.dimension != ctx.sender.dimension.id) return ctx.reply("§cне то измерение");
		if (LeaderboardBuild.removeLeaderboard(objective, location.x, location.y, location.z, ctx.sender.dimension.id)) {
			// success
			ctx.reply(`§7Таблица §f${objective} §7на §6${location.x} ${location.y} ${location.z} §7успешно §cудалена`);
			return ctx.sender.playSound(`random.orb`);
		} else {
			return ctx.reply("§cхз че за ошибка"); //§r
		}
	});

lba.literal({ name: "list" }).executes((ctx) => {
	if (!lb || lb.keys().length == 0) return ctx.reply(`§cНет лидербордов`);
	for (let leaderboard of lb.values()) {
		ctx.reply(`
        ${leaderboard.objective} (${leaderboard.location["x"]} ${leaderboard.location["y"]} ${leaderboard.location["z"]}) ${leaderboard.location["dimension"]}`);
	}
});
