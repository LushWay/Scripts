import { BlockLocation, Player } from "@minecraft/server";
import { XA } from "xapi.js";

export class zone {
  /**
   *
   * @param {Player} pl
   * @param {boolean} isX
   * @param {BlockLocation} zone
   * @param {boolean} [plus]
   */
  static ret(pl, isX, zone, plus) {
    const a = isX
      ? `${plus ? zone.x + 1 : zone.x - 1} ${pl.location.y} ${pl.location.z}`
      : `${pl.location.x} ${pl.location.y} ${plus ? zone.z + 1 : zone.z - 1}`;
    XA.Chat.rcs([
      `tp "${pl.name}" ${a}`,
      `damage "${pl.name}" 1 void`,
      `title "${pl.name}" actionbar §cЗона!`,
    ]);
  }
  //   /**
  //  *
  //  * @param {Player} pl
  //  * @param {boolean} isX
  //  * @param {BlockLocation} zone
  //  * @param {Boolean} plus
  //  */
  //    static damage(pl, isX, zone, plus) {
  //     const a = isX
  //       ? `${plus ? zone.x + 1 : zone.x - 1} ${pl.location.y} ${pl.location.z}`
  //       : `${pl.location.x} ${pl.location.y} ${plus ? zone.z + 1 : zone.z - 1}`;
  //     XA.Chat.rcs([
  //       `tp "${pl.name}" ${a}`,
  //       `title "${pl.name}" actionbar §cОграничение мира до: §f${
  //         isX ? zone.x : zone.z
  //       }${isX ? "x" : "z"}`,
  //     ]);
  //   }
  /**
   *
   * @param {Player} pl
   * @param {boolean} isX
   * @param {BlockLocation} zone
   */
  static pret(pl, isX, zone) {
    const a = isX
      ? `${zone.x} ${Math.floor(pl.location.y) + 1} ${Math.floor(
          pl.location.z
        )}`
      : `${Math.floor(pl.location.x)} ${Math.floor(pl.location.y) + 1} ${
          zone.z
        }`;
    XA.Chat.rcs([
      `particle minecraft:falling_border_dust_particle ${a}`,
      `particle minecraft:rising_border_dust_particle ${a}`,
    ]);
  }
}
