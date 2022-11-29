import { setTickInterval, ThrowError, XA } from "xapi.js";
import { world } from "@minecraft/server";
import "./commands.js";
import { LeaderboardBuild } from "./LeaderboardBuilder.js";

const lb = new XA.instantDB(world, "leaderboard");

setTickInterval(
	() => {
		try {
			if (!lb || lb.keys().length == 0) return;
			for (let leaderboard of lb.values()) {
				LeaderboardBuild.updateLeaderboard(
					leaderboard.objective,
					leaderboard.location.x,
					leaderboard.location.y,
					leaderboard.location.z,
					leaderboard.location.dimension,
					leaderboard.displayName,
					leaderboard.style
				);
			}
		} catch (error) {
			ThrowError(error);
		}
	},
	0,
	"leaderboardsInterval"
);
