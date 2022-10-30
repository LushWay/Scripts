import { lb } from "../../../database/tables.js";
import { SA } from "../../../index.js";
import { XA } from "xapi.js";

import { LeaderboardBuild } from "../build/LeaderboardBuilder.js";

const lba = new XA.Command({
  name: "lb",
  aliases: ["leaderboard"],
  description:
    "Create custom leaderboards that track players data in the world",
  usage: [
    `create <objective: string> <x> <y> <z>`,
    `remove <objective: string> <x> <y> <z>`,
    `list`,
  ],
  tags: ["owner"],
  type: "serv",
});
lba
  .addSubCommand({ name: "create" })
  .addOption("objective", "string")
  .addOption("location", "location")
  .executes((ctx, { objective, location }) => {
    if (objective.length > 16 || !/^[a-zA-Z]+$/.test(objective))
      return ctx.invalidArg(objective);
    if (lb.has(objective))
      return ctx.reply("§сТакая таблица уже существует лол");
    LeaderboardBuild.createLeaderboard(
      objective,
      location.x,
      location.y,
      location.z,
      ctx.sender.dimension.id
    );
    ctx.reply(
      `§7Таблица §f${objective} §7успешно создана на §6${location.x} ${location.y} ${location.z}`
    );
    return ctx.sender.playSound(`random.orb`);
  });
lba
  .addSubCommand({ name: "remove" })
  .addOption("objective", "string")
  .addOption("location", "location")
  .executes((ctx, { objective, location }) => {
    if (objective.length > 16 || !/^[a-zA-Z]+$/.test(objective))
      return ctx.invalidArg(objective);
    const leaderboardData = lb.get(objective);
    if (!leaderboardData)
      return ctx.reply("§cнет такой", data.sender.nameTag, [objective]);
    if (leaderboardData.location.dimension != ctx.sender.dimension.id)
      return ctx.reply("§снето измерение");
    if (
      LeaderboardBuild.removeLeaderboard(
        objective,
        location.x,
        location.y,
        location.z,
        ctx.sender.dimension.id
      )
    ) {
      // success
      ctx.reply(
        `§7Таблица §f${objective} §7на §6${location.x} ${location.y} ${location.z} §7успешно §cудалена`
      );
      return ctx.sender.playSound(`random.orb`);
    } else {
      return ctx.reply("§cхз че за ошибка");
    }
  });

lba.addSubCommand({ name: "list" }, (ctx) => {
  if (!SA.tables.lb || lb.keys().length == 0)
    return ctx.reply(`§сНет лидербордов`);
  for (let leaderboard of lb.values()) {
    ctx.reply(`
        ${leaderboard.objective} (${leaderboard.location["x"]} ${leaderboard.location["y"]} ${leaderboard.location["z"]}) ${leaderboard.location["dimension"]}`);
  }
});
