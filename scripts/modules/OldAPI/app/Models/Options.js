import { world, Player } from "@minecraft/server";
import { ScoreboardDatabase } from "../../database/types/Scoreboard";
//import * as SA from "../../../index.js";

/** @type {Array<{
    name: string;
    desc: string;
    lvl: number;
    exp: boolean;
    Aitem: string;
}>} */
export let OPTIONS = [];

export class PlayerOption {
  /**
   * Register an option
   * @param {string} name Имя опции
   * @param {string} desc Описание
   * @param {number} [permissionLvL] Уровень разрешений
   * @param {string} [ActiveItem]
   * @param {boolean} [isExpiremental]
   * @example new option('JS:enable', 'Ниче не делает', 10)
   */
  constructor(
    name,
    desc = null,
    permissionLvL = 0,
    isExpiremental = false,
    ActiveItem
  ) {
    if (!po.E(name)) {
      let description = desc;
      if (isExpiremental)
        description = desc + "§r§e\n\n▲ Экспериментальная настройка ▲";
      const a = {
        name: name,
        desc: description,
        lvl: permissionLvL,
        exp: isExpiremental,
        Aitem: ActiveItem,
      };
      OPTIONS.push(a);
      OPTIONS = OPTIONS.sort((a, b) => (a.name > b.name ? 1 : -1));
    }
  }
}
class PO {
  /**
   * Возвращает опцию
   * @param {string} option
   * @return {Object}
   * @example OptionQ('JS:enable'): name: 'JS.enable', desc: '', lvl: 3
   */
  E(option) {
    return OPTIONS.find((Element) => {
      if (Element.name == option) return Element;
    });
  }
  /**
   * Вызывает опцию на игроке
   * @param {string} option
   * @param {Player} player Игрок для запроса
   * @return {boolean}
   * @example OptionQ('JS:enable', player)
   */
  Q(option, player) {
    const e = this.E(option);
    if (e && player.hasTag(e.name)) return true;
    return false;
  }
  /**
   * Вызывает опцию на игроке
   * @param {string} option
   * @param {Player} player Игрок для запроса
   * @return {"no" | ["removed" | "added", Object]}
   * @example OptionQ('JS:enable', player)
   */
  change(option, player) {
    const e = this.E(option);
    if (!e) return "no";
    if (player.hasTag(e.name)) {
      player.removeTag(e.name);
      return ["removed", e];
    } else {
      player.addTag(e.name);
      return ["added", e];
    }
  }
  /**
   * Очищает настройки игрока
   * @param {Player} player Игрок для запроса
   */
  clear(player) {
    OPTIONS.forEach((Element) => {
      if (player.hasTag(Element.name)) player.removeTag(Element.name);
    });
  }
  /**
   * Возвращает список всех элементов и их описание у игрока
   */
  list(player) {
    let el = [];
    OPTIONS.forEach((Element) => {
      if (player.hasTag(Element.name) && Element.lvl < 20) el.push(Element);
    });
    return el;
  }
}
export const po = new PO();
/**
 * @type {Array<{name: string; desc: string, lvl: number; text: boolean}>}
 */
export let WORLDOPTIONS = [];

export const db = new ScoreboardDatabase("world");

export class wow {
  /**
   *
   * @param {string} name
   * @param {string} [displayName]
   */
  constructor(name, displayName = "a") {
    let a = displayName || name;
    if (a.length > 16) a = a.substring(0, 16);
    this.name = name;
    this.displayName = a;
    try {
      world
        .getDimension("overworld")
        .runCommand(`scoreboard objectives add ${name} dummy "${a}"`);
    } catch (e) {
      const er = JSON.parse(e);
      if (er.statusMessage.startsWith("§cЦель ")) return;
      world
        .getDimension("overworld")
        .runCommand("say §c[Error] " + er.statusMessage + " " + a.length);
    }
  }
  set(option, value) {
    world
      .getDimension("overworld")
      .runCommand(`scoreboard players set "${option}" ${this.name} ${value}`);
  }
  get(option) {
    try {
      const msg = world
        .getDimension("overworld")
        .runCommand(`scoreboard players test "${option}" ${this.name} * *`);
      const retu = msg.statusMessage.split(" ")[1];
      return retu;
    } catch (e) {
      //console.warn(e)
      return 0;
    }
  }
  Eset(entity, value) {
    entity.runCommand(`scoreboard players set @s ${this.name} ${value}`);
  }
  Eadd(entity, value) {
    entity.runCommand(`scoreboard players add @s ${this.name} ${value}`);
  }
  Eget(entity) {
    try {
      const msg = entity.runCommand(
        `scoreboard players test @s ${this.name} * *`
      );
      const retu = msg.statusMessage.split(" ")[1];
      return retu;
    } catch (e) {
      //console.warn(e)
      return 0;
    }
  }
  reset() {
    world
      .getDimension("overworld")
      .runCommand(`scoreboard players reset * ${this.name}`);
  }
  reset0() {
    for (let opt of WORLDOPTIONS) {
      console.warn(opt.name);
      if (opt.lvl <= 10 && !wo.Q(opt.name)) {
        console.warn(opt.name);
        try {
          world
            .getDimension("overworld")
            .runCommand(`scoreboard players reset "${opt.name}" ${this.name}`);
        } catch (e) {
          console.warn(e);
        }
      }
    }
  }
}
export const light_db = new wow("worldSettings");

export class WorldOption {
  /**
   * Register an option
   * @param {string} name Имя опции
   * @param {string} desc Описание
   * @param {number} permissionLvL Уровень разрешений
   * @example new option('LOL:enable', 'Описулька', true)
   */
  constructor(name, desc = null, IsTextOption = false, permissionLvL = 0) {
    if (!wo.E(name)) {
      let lvl = 0;
      let description = desc;
      if (IsTextOption) {
        lvl = 20;
        description = desc + "§r§f\n \nТекстовая опция";
      } else {
        lvl = permissionLvL;
      }
      WORLDOPTIONS.push({
        name: name,
        desc: description,
        lvl: lvl,
        text: IsTextOption,
      });
      WORLDOPTIONS = WORLDOPTIONS.sort((a, b) => (a.name > b.name ? 1 : -1));
    }
  }
}
class WO {
  /**
   * Возвращает опцию
   * @param {string} option
   * @return {Object}
   * @example E('JS:enable'): name: 'JS.enable', description: '', lvl: 3
   */
  E(option) {
    return WORLDOPTIONS.find((Element) => {
      if (Element.name == option) return Element;
    });
  }
  /**
   * Вызывает опцию
   * @param {string} option
   * @param {boolean} returnfalse
   * @return {boolean}
   * @example Q('enable')
   */
  Q(option, returnfalse = true) {
    const e = this.E(option);
    if (e && !e.text) {
      if (e.lvl < 10 && light_db.get(option) != 0) return true;
      if (db.get(option)) return true;
    }
    if (returnfalse) return false;
  }
  /**
   * Вызывает опцию
   * @param {string} option
   * @return {string}
   * @example G('values')
   */
  G(option) {
    const e = this.E(option);
    if (e && e.text) {
      return db.get(option);
    }
  }
  /**
   * Вызывает опцию
   * @param {string} option
   * @return {boolean | string}
   * @example QQ('JS:enable')
   */
  QQ(option, returnfalse = true, IsTextOption) {
    if (IsTextOption) return db.get(option);
    if (light_db.get(option) != 0) return true;
    if (db.get(option)) return true;
    if (returnfalse) return false;
  }
  /**
   * Вызывает опцию на игроке
   * @param {string} option
   * @return {["no" | "added" | "removed", object?]}
   * @example change('JS:enable')
   */
  change(option) {
    const e = this.E(option);
    if (!e) return ["no"];
    if (e.text) throw new Error("Дебил не запрашивай эту опцию через change");
    if (e.lvl < 10) {
      //console.warn('lvl < 10')
      if (e && light_db.get(option) != 0) {
        light_db.set(option, 0);
        return ["removed", e];
      } else {
        light_db.set(option, 1);
        return ["added", e];
      }
    } else {
      if (e && db.get(option)) {
        db.set(option, 0);
        return ["removed", e];
      } else {
        db.set(option, 1);
        return ["added", e];
      }
    }
  }
  /**
   * Устанавливает текстовую настройку
   * @param {String} option
   * @param {String | Boolean | Number} value
   * @returns
   */
  set(option, value) {
    const e = this.E(option);
    //if (!e) throw new Error("Дебил нет такой опции " + option);
    if (!e.text)
      throw new Error("Дебил не запрашивай эту опцию через set " + option);
    db.set(option, value);
  }
  /**
   * Очищает настройки мира
   */
  clear() {
    let count = 0;
    WORLDOPTIONS.forEach((Element) => {
      if (db.get(Element.name) != undefined) {
        db.set(Element.name, 0);
        count++;
      }
      return count;
    });
  }
  /**
   * Возвращает список всех элементов и их описание
   */
  list() {
    let el = [];
    WORLDOPTIONS.forEach((Element) => {
      if (db.get(Element.name) != undefined && Element.lvl < 20)
        el.push(Element);
    });
    return el;
  }
}
export const wo = new WO();
