// @ts-nocheck

import { BlockLocation, Player } from "@minecraft/server";
//import { GameTestSequence } from "mojang-gametest";
import { sleep, XA } from "xapi.js";
import { configuration } from "../config.js";
//import { SHAPES } from "../definitions/shapes.js";
import { Cuboid } from "../utils/Cuboid.js";
import { Structure } from "./StructureBuilder.js";

export class WorldEditBuilder {
  constructor() {
    this.drawsel = configuration.DRAW_SELECTION_DEFAULT;
    this.pos1 = { x: 0, y: 0, z: 0 };
    this.pos2 = { x: 0, y: 0, z: 0 };
    this.history = [];
    this.undos = [];
    this.current_copy = { pos1: null, pos2: null, name: "" };
  }

  drawSelection() {
    if (!this.drawsel)
      return XA.Chat.rcs([
        `event entity @e[type=f:t,name="${configuration.DRAW_SELECTION1_NAME}"] kill`,
        `event entity @e[type=f:t,name="${configuration.DRAW_SELECTION2_NAME}"] kill`,
      ]);
    const ent1 = XA.Entity.getEntityAtPos(
      this.pos1.x,
      this.pos1.y,
      this.pos1.z
    );
    const ent2 = XA.Entity.getEntityAtPos(
      this.pos2.x,
      this.pos2.y,
      this.pos2.z
    );
    if (ent1.length == 0) {
      XA.Chat.runCommand(
        `event entity @e[type=f:t,name="${configuration.DRAW_SELECTION1_NAME}"] kill`
      );
      XA.Chat.runCommand(
        `summon f:t ${this.pos1.x} ${this.pos1.y} ${this.pos1.z} spawn "${configuration.DRAW_SELECTION1_NAME}"`
      );
    }
    if (ent2.length == 0) {
      XA.Chat.runCommand(
        `event entity @e[type=f:t,name="${configuration.DRAW_SELECTION2_NAME}"] kill`
      );
      XA.Chat.runCommand(
        `summon f:t ${this.pos2.x} ${this.pos2.y} ${this.pos2.z} spawn "${configuration.DRAW_SELECTION2_NAME}"`
      );
    }
    for (let ent of ent1) {
      if (ent.id == "f:t" && ent.nameTag == configuration.DRAW_SELECTION1_NAME)
        break;
      XA.Chat.runCommand(
        `event entity @e[type=f:t,name="${configuration.DRAW_SELECTION1_NAME}"] kill`
      );
      XA.Chat.runCommand(
        `summon f:t ${this.pos1.x} ${this.pos1.y} ${this.pos1.z} spawn "${configuration.DRAW_SELECTION1_NAME}"`
      );
      break;
    }
    for (let ent of ent2) {
      if (ent.id == "f:t" && ent.nameTag == configuration.DRAW_SELECTION2_NAME)
        break;
      XA.Chat.runCommand(
        `event entity @e[type=f:t,name="${configuration.DRAW_SELECTION2_NAME}"] kill`
      );
      XA.Chat.runCommand(
        `summon f:t ${this.pos2.x} ${this.pos2.y} ${this.pos2.z} spawn "${configuration.DRAW_SELECTION2_NAME}"`
      );
      break;
    }
  }
  /**
   * Backups a location
   * @param {BlockLocation} pos1 Position 1 of cuboid location
   * @param {BlockLocation} pos2 Position 2 of cuboid location
   * @param {Array} saveLocation Save location where you want the data to store your backup
   * @returns {Promise<Return>}
   * @example backup(pos1, pos2, history);
   */
  async backup(
    pos1 = this.pos1,
    pos2 = this.pos2,
    saveLocation = this.history
  ) {
    const structure = new Structure(configuration.BACKUP_PREFIX, pos1, pos2);
    saveLocation.push(structure);
    return new Return(false);
  }

  /**
   * Undoes the latest history save
   * @param {number} ammount times you want to undo
   * @returns {Return}
   * @example undo(2);
   */
  undo(ammount = 1) {
    try {
      if (this.history.length < ammount) ammount = this.history.length;
      const backups = this.history.slice(-ammount);
      for (const elm of backups.reverse()) {
        this.backup(elm.pos1, elm.pos2, this.undos);
        elm.load();
        this.history.splice(this.history.indexOf(elm), 1);
      }
      return new Return(false, 0, {
        statusMessage: `§a► §rУспешно отменено ${ammount} бэкапов!`,
      });
    } catch (error) {
      //console.warn(error + error.stack);
      return new Return(true, 1, {
        statusMessage: `§4► ${error}`,
      });
    }
  }
  /**
   * Redoes the latest history save
   * @returns {Return}
   * @example redo();
   */
  redo() {
    try {
      if (this.undos.length == 0) throw new Error("Нечего отменять");
      const data = this.undos.slice(-1)[0];
      this.backup(data.pos1, data.pos2);
      data.load();
      this.undos.pop();
      return new Return(false, 0, {
        statusMessage: `§a► §rУспешно возвращено!`,
      });
    } catch (error) {
      //console.warn(error + error.stack);
      return new Return(true, 1, {
        statusMessage: `§4► ${error}`,
      });
    }
  }
  /**
   * Copys The curret positions
   * @returns {Return}
   * @example copy();
   */
  copy() {
    try {
      this.current_copy = {
        pos1: this.pos1,
        pos2: this.pos2,
        name: configuration.COPY_FILE_NAME,
      };
      const opt = XA.Chat.newCommand(
        `structure save ${configuration.COPY_FILE_NAME} ${this.pos1.x} ${this.pos1.y} ${this.pos1.z} ${this.pos2.x} ${this.pos2.y} ${this.pos2.z} false memory`
      );
      if (opt) throw new Error(opt);
      return new Return(false, 0, {
        pos1: this.pos1,
        pos2: this.pos2,
        statusMessage: `§9► §rСкопированно из ${this.pos1.x} ${this.pos1.y} ${this.pos1.z} to ${this.pos2.x} ${this.pos2.y} ${this.pos2.z}`,
      });
    } catch (error) {
      //console.warn(error + error.stack);
      return new Return(true, 1, {
        statusMessage: `§4► Не удалось скорпировать [${error}]`,
      });
    }
  }
  /**
   * Pastes a copy from memory
   * @param {Player} player player to execute on
   * @param {0 | 90 | 180 | 270} rotation Specifies the rotation when loading a structure
   * @param {"none" | "x" | "xz" | "z"} mirror Specifies the axis of mirror flip when loading a structure
   * @param {Boolean} includesEntites Specifies whether including entites or not
   * @param {Boolean} includesBlocks Specifies whether including blocks or not
   * @param {number} integrity Specifies the integrity (probability of each block being loaded). If 100, all blocks in the structure are loaded.
   * @param {string} seed Specifies the seed when calculating whether a block should be loaded according to integrity. If unspecified, a random seed is taken.
   * @returns {Return}
   * @example paste(Player, 0, "none", false, true, 100.0, "");
   */
  paste(
    player,
    rotation = 0,
    mirror = "none",
    includesEntites = false,
    includesBlocks = true,
    integrity = 100.0,
    seed = ""
  ) {
    try {
      const dx = Math.abs(this.current_copy.pos2.x - this.current_copy.pos1.x);
      const dy = Math.abs(this.current_copy.pos2.y - this.current_copy.pos1.y);
      const dz = Math.abs(this.current_copy.pos2.z - this.current_copy.pos1.z);
      const pos2 = new BlockLocation(
        player.location.x,
        player.location.y,
        player.location.z
      ).offset(dx, dy, dz);

      this.backup(player.location, pos2);

      player.runCommand(
        `structure load ${configuration.COPY_FILE_NAME} ~ ~ ~ ${String(
          rotation
        ).replace(
          "NaN",
          "0"
        )}_degrees ${mirror} ${includesEntites} ${includesBlocks} ${
          integrity ? integrity : ""
        } ${seed ? seed : ""}`
      );
      return new Return(false, 0, {
        location: player.location,
        statusMessage: `§a► §rВставлено в ${Math.floor(
          player.location.x
        )} ${Math.floor(player.location.y)} ${Math.floor(player.location.z)}`,
      });
    } catch (error) {
      console.warn(error + error.stack);
      return new Return(true, 1, {
        statusMessage: `§4Не удалось вставить [${
          error.statusMessage ? error.statusMessage : error
        }]`,
      });
    }
  }
  /**
   * Fills All blocks between pos1 and pos 2
   * @async
   * @param {string} block valid minecraft block
   * @returns {Promise<Return>}
   * @example fillBetween("stone");
   */
  async fillBetween(block, data = -1, replaceMode, replaceBlock, rbData) {
    const startTime = Date.now();
    this.backup();
    const Cube = new Cuboid(this.pos1, this.pos2);
    const blocks = Cube.blocksBetween;
    let errors = 0;
    let comm = 0;
    for (const cube of Cube.split(configuration.FILL_CHUNK_SIZE)) {
      const opt = XA.Chat.newCommand(
        `fill ${cube.pos1.x} ${cube.pos1.y} ${cube.pos1.z} ${cube.pos2.x} ${
          cube.pos2.y
        } ${cube.pos2.z} ${block} ${data} ${replaceMode ? replaceMode : ""} ${
          replaceBlock ? replaceBlock : ""
        } ${rbData ? rbData : ""}`
      );
      if (opt) {
        errors++;
      }
      comm++;

      await sleep(1);
    }

    const endTime = Math.round(Date.now() - startTime);
    if (errors) {
      return new Return(false, 0, {
        fillCount: blocks,
        statusMessage: `§4► §c${errors}§f\\§a${0}§7 Заполнено с ошибкой, §f${blocks} §7(§f~${endTime}§7 мс). ${
          replaceMode
            ? `Режим заполнения: §f${replaceMode}§7, заполняемый блок: §f${replaceBlock} `
            : ""
        }${rbData ? rbData : ""}`,
      });
    }
    return new Return(false, 0, {
      fillCount: blocks,
      statusMessage: `§a► §7Заполненно, §f${blocks} §7(§f~${endTime}§7 мс). ${
        replaceMode
          ? `Режим заполнения: §f${replaceMode}§7, заполняемый блок: §f${replaceBlock} `
          : ""
      }${rbData ? rbData : ""}`,
    });
  }
  getPoses() {
    return {
      p1: this.pos1,
      p2: this.pos2,
      bp1: new BlockLocation(this.pos1.x, this.pos1.y, this.pos1.z),
      bp2: new BlockLocation(this.pos2.x, this.pos2.y, this.pos2.z),
    };
  }
}
export const WorldEditBuild = new WorldEditBuilder();
