import { setTickInterval, XA } from "xapi.js";
import "./commands.js";
import { LeaderboardBuild } from "./LeaderboardBuilder.js";

setTickInterval(() => {
  try {
    if (!XA.OLDDB.lb || XA.OLDDB.lb.keys().length == 0) return;
    for (let leaderboard of XA.OLDDB.lb.values()) {
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
}, 0);
