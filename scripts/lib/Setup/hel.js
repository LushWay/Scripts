// @ts-nocheck

import { world } from "@minecraft/server";
import { CommandBuilder } from "../Builders/CommandBuilder";

CommandBuilder.create(
	{
		name: "test",
		description: "This is a test command",
		example: [".test"],
		permission: (player) => player.hasTag("test"),
	},
	async (data) => {
		const scoreboard = world.scoreboard.addObjective("toggle", "toggle");
		let score = 0;
		try {
			score = scoreboard.getScore(data.player.scoreboard);
		} catch (e) {} // You can replace this 4 lines if you have getScore function

		data.player.runCommandAsync(`scoreboard players set @s toggle ${score === 0 ? 1 : 0}`);
		data.player.tell(`§¶§cTest §bHas been toggled ${score === 0 ? "§2ON" : "§4OFF"} §bby: §c${data.player.name}`);
	}
);
