import {
  BlockRaycastOptions,
  Location,
  MinecraftEffectTypes,
  Player,
  Vector,
  world,
} from "@minecraft/server";
import { SA } from "../../index.js";
import { XA } from "xapi.js";
import { rd } from "../Airdrops/index.js";

function isNear(x, xx, z, zz) {
  if (Math.max(x, xx) - Math.min(xx, x) < 10) return true;
  if (Math.max(z, zz) - Math.min(z, zz) < 10) return true;
  return false;
}
/**
 *
 * @param {Player} player
 */
export function rtp(player, xx, zz, maxrad, minrad, otherposes) {
  let y,
    x,
    z,
    C = 0,
    r,
    mr,
    xxx,
    zzz,
    ttt,
    ooo;
  if (maxrad >= minrad) {
    (r = maxrad), (mr = minrad);
  } else {
    (r = minrad), (mr = maxrad);
  }
  xxx = xx + r;
  zzz = zz + r;
  ttt = zz - r;
  ooo = xx - r;
  world.say(
    "x: " +
      xxx +
      " z: " +
      zzz +
      " -x: " +
      ooo +
      " -z: " +
      ttt +
      " o: " +
      SA.Utilities.format.stringifyEx(otherposes, " ")
  );
  while (!y && C < 300) {
    C++;
    x = rd(xx + r, xx + mr);
    z = rd(zz + r, zz + mr);
    if (Math.round(Math.random())) x = rd(xx - r, xx - mr);
    if (Math.round(Math.random())) z = rd(zz - r, zz - mr);
    let c = false;
    if (otherposes && otherposes.length > 0)
      for (const e of otherposes) {
        if (isNear(x, e.x, z, e.z)) {
          c = true;
          world.say("§cNear, skip");
          break;
        }
      }
    if (c) continue;
    const q = new BlockRaycastOptions();
    (q.includeLiquidBlocks = false), (q.includePassableBlocks = false);
    const b = world
      .getDimension("overworld")
      .getBlockFromRay(new Location(x, 320, z), new Vector(0, -220, 0));
    if (b && b.location.y >= 63) {
      y = b.location.y + 1;
      break;
    }
  }
  if (!y) {
    player.tell("§cНе удалось найти подходящее место на земле");
    y = 100;
    player.runCommandAsync("effect @s slow_falling 20 1 true");
  }
  player.teleport(
    new Location(x, y, z),
    world.getDimension("overworld"),
    0,
    90,
    false
  );
  return { x: x, y: y, z: z };
}
