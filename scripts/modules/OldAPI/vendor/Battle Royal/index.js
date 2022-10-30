import { WorldOption } from "../../app/Models/Options.js";
import { SA } from "../../index.js";
import { XA } from "xapi.js";
import { Player, world } from "@minecraft/server";
import { Atp } from "../Portals/index.js";
import { br } from "./br.js";
import { rtp } from "./rtp.js";

new WorldOption("br:time", "Время игры в формате MM:SS (15:00)", true);
new WorldOption("br:pos", "x y z", true);
new WorldOption("br:gamepos", "x z", true);
/**
 * @type {Array<String>}
 */
export let quene = {};
let minpl = 2,
  fulltime = 5,
  shorttime = 3;

SA.Exceptions.E.onEvent("br:join", ({ player }) => {
  /**
   * @type {Player}
   */
  const pl = player;
  if (br.players.map((e) => e.name).includes(pl.name)) return;
  if (br.game.started)
    return pl.onScreenDisplay.setActionBar(`§cИгра уже идет!`);
  if (quene[pl.name])
    return pl.onScreenDisplay.setActionBar(
      `§6${Object.keys(quene).length}/${minpl} §g○ §6${br.quene.time}`
    );
  quene[pl.name] = true;
  world.say(
    `§aВы успешно встали в очередь. §f(${
      Object.keys(quene).length
    }/${minpl}). §aДля выхода пропишите §f-br quit`,
    pl.name
  );
  pl.playSound("random.orb");
});

SA.Exceptions.E.onEvent("br:ded", (player) => {
  const pl = player.player;
  world.say("§6Ты погиб!", pl.name);
  Atp(pl, "br", true, true, true);
});

SA.Utilities.time.setTickInterval(
  () => {
    if (
      !br.game.started &&
      [...world.getPlayers()].filter((e) =>
        SA.Build.entity.getTagStartsWith(e, "br:")
      ).length > 0
    ) {
      br.end("specially", "Перезагрузка");
    }
    if (Object.keys(quene).length >= minpl && Object.keys(quene).length < 10) {
      if (!br.quene.open) {
        br.quene.open = true;
        br.quene.time = fulltime;
        Object.keys(quene).forEach((e) => {
          world.say(
            `§7${
              Object.keys(quene).length
            }/${minpl} §9Игроков в очереди! Игра начнется через §7${fulltime}§9 секунд.`,
            e
          );
          const a = SA.Build.entity.fetch(e);
          if (a) a.playSound("random.levelup");
        });
      }
      if (Object.keys(quene).length >= 10) {
        br.quene.open = true;
        br.quene.time = 16;
        Object.keys(quene).forEach((e) => {
          world.say(
            `§6Сервер заполнен! §7(${Object.keys(quene).length}/${minpl}).`,
            e
          );
          const a = SA.Build.entity.fetch(e);
          if (a) a.playSound("random.levelup");
        });
      }
      if (br.quene.open && br.quene.time > 0) {
        br.quene.time--;
      }
      if (br.quene.time >= 1 && br.quene.time <= shorttime) {
        let sec = "секунд",
          hrs = `${br.quene.time}`;
        if (hrs.endsWith("1") && hrs != "11") {
          sec = "секунду";
        } else if (hrs == "2" || hrs == "3" || hrs == "4") {
          sec = `секунды`;
        }
        Object.keys(quene).forEach((e) => {
          world.say(`§9Игра начнется через §7${br.quene.time} ${sec}`, e);
          const a = SA.Build.entity.fetch(e);
          if (a) a.playSound("random.click");
        });
      }
      if (br.quene.open && br.quene.time == 0) {
        br.start(Object.keys(quene));
        quene = {};
      }
    }
    Object.keys(quene).forEach((e) => {
      if (!SA.Build.entity.fetch(e)) delete quene[e];
    });
    if (br.quene.open && Object.keys(quene).length < minpl) {
      br.quene.open = false;
      br.quene.time = 0;
      Object.keys(quene).forEach((e) => {
        world.say(
          `§7${
            Object.keys(quene).length
          }/${minpl} §9Игроков в очереди. §cИгра отменена...`,
          e
        );
        const a = SA.Build.entity.fetch(e);
        if (a) a.playSound("note.bass");
      });
    }
  },
  20,
  "br"
);

const bbr = new XA.Command(
  { name: "br", description: "Телепортирует на спавн батл рояля" },
  (ctx) => {
    Atp(ctx.sender, "br");
  }
);
bbr.addSubCommand({ name: "quit", description: "Выйти из очереди" }, (ctx) => {
  if (quene[ctx.sender.name]) {
    delete quene[ctx.sender.name];
    ctx.reply("§aВы вышли из очереди.");
  } else {
    ctx.reply("§cВы не стоите в очереди.");
  }
});
bbr.addSubCommand({ name: "quitgame", description: "Выйти из игры" }, (ctx) => {
  if (ctx.sender.hasTag("locktp:br")) {
    delete br.players[br.players.findIndex((e) => e.name == ctx.sender.name)];
    br.tags.forEach((e) => ctx.sender.removeTag(e));
    ctx.reply("§aВы вышли из игры.");
    Atp(ctx.sender, "br");
  } else {
    ctx.reply("§cВы не находитесь в игре.");
  }
});

bbr.addSubCommand(
  { name: "start", description: "", tags: ["owner"] },
  (ctx) => {
    br.start(Object.keys(quene));
    quene = {};
  }
);

bbr.addSubCommand({ name: "stop", description: "", tags: ["owner"] }, (ctx) => {
  br.end("specially", "Так надо");
  quene = {};
});

world.events.playerJoin.subscribe((j) => {
  const jj = j.player;
  SA.Utilities.time.setTickTimeout(() => {
    if (
      jj &&
      jj?.name &&
      SA.Build.entity.fetch(jj.name) &&
      SA.Build.entity.getTagStartsWith(jj, "br:")
    ) {
      br.tags.forEach((e) => jj.removeTag(e));
      Atp(jj, "br");
    }
  }, 5);
});
