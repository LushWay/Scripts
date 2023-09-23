import { Player, Vector, world } from "@minecraft/server";
import { Anarchy, Spawn } from "../../modules/Gameplay/Survival/index.js";
import { ActionForm } from "../Form/ActionForm.js";
import { Place } from "./Action.js";
import { Sidebar } from "./Sidebar.js";

// @ts-expect-error
Set.prototype.toJSON = function () {
	return "Set<size=" + this.size + ">";
};

/**
 * @typedef {{
 *   quest?: {
 * 		active: string,
 * 		completed?: string[],
 * 		step?: number,
 * 		additional?: any
 *   }
 * }} QuestDB
 */

export class Quest {
	/** @type {import("./Sidebar.js").SidebarLinePreinit} */
	static sidebar = {
		preinit(sidebar) {
			const onquestupdate = sidebar.updateAll.bind(sidebar);

			return function (player) {
				const status = Quest.active(player);
				if (!status) return false;

				const listeners = status.quest.steps(player).updateListeners;
				if (!listeners.has(onquestupdate)) listeners.add(onquestupdate);

				return `§6Квест: §f${
					status.quest.name
				}\n${status.step.text()}\n§6Подробнее: §f-q`;
			};
		},
	};

	/**
	 * @type {Record<string, Quest>}
	 */
	static instances = {};

	/**
	 * @type {Record<string, QuestSteps>}
	 */
	players = {};

	/**
	 * @param {Player} player
	 */
	steps(player) {
		if (this.players[player.id]) return this.players[player.id];

		this.players[player.id] = new QuestSteps(this, player);
		this.init(this.players[player.id], player);

		world.afterEvents.playerLeave.subscribe(
			({ playerId }) => delete this.players[playerId],
		);

		return this.players[player.id];
	}

	/**
	 * @param {string} name
	 * @param {(q: QuestSteps, p: Player) => void} init
	 */
	constructor(name, init) {
		this.name = name;
		this.init = init;
		Quest.instances[this.name] = this;
		world.getAllPlayers().forEach(setQuests);
	}

	/**
	 * @param {Player} player
	 */
	enter(player) {
		this.step(player, 0);
	}

	/**
	 * @param {Player} player
	 * @param {number} stepNum
	 */
	step(player, stepNum, deleteAdd = true) {
		/** @type {PlayerDB<QuestDB>} */
		const { data, save } = player.db();
		data.quest ??= {
			active: this.name,
		};
		data.quest.active = this.name;

		if (deleteAdd) delete data.quest.additional;
		data.quest.step = stepNum;
		save();

		const step = this.steps(player).list[stepNum];
		if (!step) return false;
		step.cleanup = step.activate?.().cleanup;
	}

	/**
	 * @param {Player} player
	 */
	exit(player) {
		/** @type {PlayerDB<QuestDB>} */
		const { data, save } = player.db();

		data.quest = {
			active: "",
			completed: data.quest?.completed ?? [],
		};

		save();
	}

	/**
	 * @param {Player} player
	 */
	static active(player) {
		/** @type {PlayerDB<QuestDB>} */
		const { data } = player.db();
		if (!data.quest || typeof data.quest.active === "undefined") return false;

		const quest = Quest.instances[data.quest.active];
		if (!quest || typeof data.quest.step === "undefined") return false;

		return {
			quest,
			stepNum: data.quest.step,
			step: quest.steps(player).list[data.quest.step],
		};
	}
}

/**
 * @param {Player} player
 */
function setQuests(player) {
	const status = Quest.active(player);
	if (!status) return;

	status.quest.step(player, status.stepNum, false);
}

world.afterEvents.playerSpawn.subscribe(({ player }) => setQuests(player));

/**
 * @typedef {() => string} QuestText
 */

/**
 * @typedef {{
 *   text: QuestText,
 *   activate?(): { cleanup(): void },
 * }} QuestStepInput
 */

/**
 * @typedef {{
 *   finish(): void
 *   cleanup?(): void
 *   player: Player
 *   parent: Quest
 * } & QuestStepInput & Pick<QuestSteps, "parent" | "player" | "updateListeners" | "update">} QuestStepThis
 */

class QuestSteps {
	/**
	 * @param {Quest} parent
	 * @param {Player} player
	 */
	constructor(parent, player) {
		this.parent = parent;
		this.player = player;
	}

	/**
	 * @type {(QuestStepThis)[]}
	 */
	list = [];

	updateListeners = new Set();
	update() {
		this.updateListeners.forEach((e) => e());
	}

	/**
	 * @param {QuestStepInput & ThisType<QuestStepThis>} options
	 */
	dynamic(options) {
		const step = this;
		const i = this.list.length;
		/** @type {QuestSteps["list"][number]} */
		const listStep = {
			updateListeners: this.updateListeners,
			player: this.player,
			update: this.update.bind(this),
			parent: this.parent,
			...options,

			finish() {
				this.cleanup?.();
				if (step.list[i + 1]) {
					this.parent.step(this.player, i + 1);
				} else {
					this.parent.exit(this.player);
					step._end();
				}
				this.update();
				this.updateListeners.clear();
			},
		};
		this.list.push(listStep);
		return listStep;
	}

	/**
	 *
	 * @param {(this: QuestStepThis) => void} action
	 */
	start(action) {
		this.dynamic({
			text() {
				return "";
			},
			activate() {
				action.bind(this)();
				this.finish();
				return { cleanup() {} };
			},
		});
	}

	/**
	 * @param {Vector3} from
	 * @param {Vector3} to
	 * @param {string} text
	 */
	place(from, to, text) {
		const steps = this;
		return this.dynamic({
			text() {
				return text;
			},
			activate() {
				/** @type {ReturnType<typeof Place.action>[]} */
				const actions = [];
				for (const pos of Vector.foreach(from, to)) {
					actions.push(
						Place.action(pos, (player) => {
							if (player.id !== steps.player.id) return;

							this.finish();
						}),
					);
				}

				return {
					cleanup() {
						actions.forEach((e) => {
							Place.actions[e.id].delete(e.action);
						});
					},
				};
			},
		});
	}

	/**
	 * @typedef {{
	 *   value?: number,
	 *   end: number,
	 *   text(value: number): string,
	 * } & Omit<QuestStepInput, "text">
	 * } QuestCounterInput
	 */

	/**
	 * @typedef {QuestStepThis & { diff(this: QuestStepThis, m: number): void } & QuestCounterInput} QuestCounterThis
	 */

	/**
	 * @param {QuestCounterInput & Partial<QuestCounterThis> & ThisType<QuestCounterThis>} options
	 */
	counter(options) {
		options.value ??= 0;

		options.diff = function (diff) {
			options.value ??= 0;
			const result = options.value + diff;

			if (result < options.end) {
				// Saving value to db
				/** @type {PlayerDB<QuestDB>} */
				const { data, save } = this.player.db();
				if (data.quest) data.quest.additional = result;
				save();

				// Updating interface
				options.value = result;
				console.debug({ update: result });
				this.update();
			} else {
				console.debug({ finish: result, this: this });

				this.finish();
			}
		};

		const inputedActivate = options.activate?.bind(options);
		const listStep = this.dynamic({
			...options,
			activate() {
				/** @type {PlayerDB<QuestDB>} */
				const { data } = this.player.db();
				if (typeof data.quest?.additional === "number")
					options.value = data.quest?.additional;

				options.value ??= 0;

				return inputedActivate() ?? { cleanup() {} };
			},
			text: () => options.text.bind(options)(options.value),
		});

		// Make access to step this. values
		Object.setPrototypeOf(options, listStep);
	}

	/**
	 * @param {QuestStepInput} o
	 */
	dialogue({ text }) {}

	/**
	 * @param {string} reason
	 */
	failed(reason) {
		this.dynamic({
			activate: () => {
				this.player.tell(reason);
				this.parent.exit(this.player);
				return { cleanup() {} };
			},
			text: () => "",
		});
	}

	/** @private */
	_end = () => {};

	/**
	 * @param {(this: QuestSteps) => void} action
	 */
	end(action) {
		this._end = action;
	}
}

if (Anarchy.portal) {
	const learning = new Quest("Обучение", (q) => {
		if (!Anarchy.portal || !Anarchy.portal.from || !Anarchy.portal.to)
			return q.failed("§cСервер не настроен");

		q.start(function () {
			this.player.tell("§6Квест начался!");
			this.player.playSound("note.pling");
		});

		q.place(Anarchy.portal.from, Anarchy.portal.to, "§6Зайди в портал анархии");

		q.counter({
			end: 5,
			text(value) {
				return `§6Наруби §f${value}/${this.end} §6блоков дерева`;
			},
			activate() {
				const blocksEvent = world.afterEvents.blockBreak.subscribe(
					({ player, brokenBlockPermutation }) => {
						if (player.id !== this.player.id) return;
						if (
							!Spawn.startAxeCanBreak.includes(brokenBlockPermutation.type.id)
						)
							return;

						this.diff(1);
					},
				);

				return {
					cleanup() {
						world.afterEvents.blockBreak.unsubscribe(blocksEvent);
					},
				};
			},
		});

		q.end(function () {
			this.player.playSound("note.pling");
			this.player.tell("§6Квест закончен!");
		});
	});

	new XCommand({
		name: "q",
		role: "admin",
	}).executes((ctx) => {
		const form = new ActionForm("Quests", "Выбери");
		form.addButton("Learning", () => {
			learning.enter(ctx.sender);
		});
		form.show(ctx.sender);
	});

	const anarchySidebar = new Sidebar(
		{ name: "Anarchy" },
		(player) => {
			return "§7Инвентарь: " + player.db().data.inv;
		},
		(player) => {
			return `§7Монеты: §6${player.scores.money}§7 | Листья: §2${player.scores.leafs}`;
		},
		" ",
		Quest.sidebar,
		" ",
		"§7shp1nat56655.portmap.io",
	);
	anarchySidebar.setUpdateInterval(20);

	world.getAllPlayers().forEach((e) => anarchySidebar.subscribe(e));

	world.afterEvents.playerSpawn.subscribe(({ player }) => {
		anarchySidebar.subscribe(player);
	});

	world.afterEvents.playerLeave.subscribe(({ playerId }) => {
		anarchySidebar.unsubscribe(playerId);
	});
}
