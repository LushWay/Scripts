import "./modules/commands.js";
import { LeaderboardBuild } from "./build/LeaderboardBuilder.js";
import { SA } from "../../index.js";
import { XA } from "xapi.js";
import { lb } from "../../database/tables.js";

SA.Utilities.time.setTickInterval(() => {
  try {
    if (!SA.tables.lb || lb.keys().length == 0) return;
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
    //console.warn(`${error} : ${error.stack}`);
  }
}, "lb");
