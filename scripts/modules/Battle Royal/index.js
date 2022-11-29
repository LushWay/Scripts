import { Player, world } from "@minecraft/server";
import { setTickInterval, setTickTimeout, XA } from "xapi.js";
import { WorldOption } from "../../lib/Class/XOptions.js";
import { Atp } from "../Server/portals.js";
import { BATTLE_ROYAL_EVENTS, br } from "./br.js";
import { quene } from "./var.js";

new WorldOption("br:time", "Время игры в формате MM:SS (15:00)", true);
new WorldOption("br:pos", "x y z", true);
new WorldOption("br:gamepos", "x z", true);

let minpl = 2,
	fulltime = 5,
	shorttime = 3;

/**
 *
 * @param {string} sound
 * @param {string} text
 */
function forEveryQuenedPlayer(sound, text) {
	for (const name in quene) {
		const player = XA.Entity.fetch(name);
		if (!player) {
			delete quene[name];
			continue;
		}
		player.tell(text);
		player.playSound(sound);
	}
}

const ks = Object.keys;
BATTLE_ROYAL_EVENTS.playerJoin.subscribe((player) => {
	/**
	 * @type {Player}
	 */
	const pl = player;
	if (br.players.map((e) => e.name).includes(pl.name)) return;
	if (br.game.started) return pl.onScreenDisplay.setActionBar(`§cИгра уже идет!`);
	if (quene[pl.name]) return pl.onScreenDisplay.setActionBar(`§6${ks(quene).length}/${minpl} §g○ §6${br.quene.time}`);
	quene[pl.name] = true;
	pl.tell(`§aВы успешно встали в очередь. §f(${ks(quene).length}/${minpl}). §aДля выхода пропишите §f-br quit`);
	pl.playSound("random.orb");
});

BATTLE_ROYAL_EVENTS.death.subscribe((pl) => {
	pl.tell("§6Ты погиб!");
	Atp(pl, "br", { lock: true, pvp: true, quene: true });
});

setTickInterval(
	() => {
		if (!br.game.started && [...world.getPlayers()].filter((e) => XA.Entity.getTagStartsWith(e, "br:")).length > 0) {
			br.end("specially", "Перезагрузка");
		}
		if (ks(quene).length >= minpl && ks(quene).length < 10) {
			if (!br.quene.open) {
				br.quene.open = true;
				br.quene.time = fulltime;
				forEveryQuenedPlayer(
					"random.levelup",
					`§7${ks(quene).length}/${minpl} §9Игроков в очереди! Игра начнется через §7${fulltime}§9 секунд.`
				);
			}
			if (ks(quene).length >= 10) {
				br.quene.open = true;
				br.quene.time = 16;
				forEveryQuenedPlayer("random.levelup", `§6Сервер заполнен! §7(${ks(quene).length}/${minpl}).`);
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
				forEveryQuenedPlayer("random.click", `§9Игра начнется через §7${br.quene.time} ${sec}`);
			}
			if (br.quene.open && br.quene.time == 0) {
				br.start(ks(quene));
				Object.assign({}, quene);
			}
		}
		ks(quene).forEach((e) => {
			if (!XA.Entity.fetch(e)) delete quene[e];
		});
		if (br.quene.open && ks(quene).length < minpl) {
			br.quene.open = false;
			br.quene.time = 0;
			forEveryQuenedPlayer("note.bass", `§7${ks(quene).length}/${minpl} §9Игроков в очереди. §cИгра отменена...`);
		}
	},
	20,
	"battleRoyal"
);

const bbr = new XA.Command({
	name: "br",
	description: "Телепортирует на спавн батл рояля",
}).executes((ctx) => {
	Atp(ctx.sender, "br");
});

bbr.literal({ name: "quit", description: "Выйти из очереди" }).executes((ctx) => {
	if (quene[ctx.sender.name]) {
		delete quene[ctx.sender.name];
		ctx.reply("§aВы вышли из очереди.");
	} else {
		ctx.reply("§cВы не стоите в очереди.");
	}
});

bbr.literal({ name: "quitgame", description: "Выйти из игры" }).executes((ctx) => {
	if (ctx.sender.hasTag("locktp:br")) {
		delete br.players[br.players.findIndex((e) => e.name == ctx.sender.name)];
		br.tags.forEach((e) => ctx.sender.removeTag(e));
		ctx.reply("§aВы вышли из игры.");
		Atp(ctx.sender, "br");
	} else {
		ctx.reply("§cВы не находитесь в игре.");
	}
});

bbr
	.literal({
		name: "start",
		description: "",
		requires: (p) => p.hasTag("owner"),
	})
	.executes(() => {
		br.start(ks(quene));
		Object.assign({}, quene);
	});

bbr
	.literal({
		name: "stop",
		description: "",
		requires: (p) => p.hasTag("owner"),
	})
	.executes(() => {
		br.end("specially", "Так надо");
		Object.assign({}, quene);
	});

world.events.playerJoin.subscribe((j) => {
	const jj = j.player;
	setTickTimeout(() => {
		if (jj && jj?.name && XA.Entity.fetch(jj.name) && XA.Entity.getTagStartsWith(jj, "br:")) {
			br.tags.forEach((e) => jj.removeTag(e));
			Atp(jj, "br");
		}
	}, 5);
});
