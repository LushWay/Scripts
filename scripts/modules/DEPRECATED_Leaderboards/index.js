import { setTickInterval, ThrowError } from "xapi.js";
import { Database } from "../../lib/Database/Entity.js";
import "./commands.js";
import { LeaderboardBuild } from "./LeaderboardBuilder.js";

export const lb = new Database("leaderboard");

setTickInterval(
	() => {
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
	},
	0,
	"leaderboardsInterval"
);
