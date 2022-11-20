import { Player, world } from "@minecraft/server";

export const Chat = {
	/**
	 *Запускает команду
	 * @param {string} command minecraft /command
	 * @param {"overworld" | "nether" | "end"} [dimension]
	 * @param {boolean} [debug] true консоль регистрирует команду, иначе она запускает команду
	 * @returns {Object}
	 * @example runCommand(`say test`)
	 */
	runCommand(
		command,
		dimension = "overworld",
		debug = false,
		deepdebug = false
	) {
		try {
			return debug
				? console.warn(JSON.stringify(this.runCommand(command)))
				: world.getDimension(dimension).runCommand(command);
		} catch (error) {
			if (deepdebug) {
				console.warn(error);
			}
			return { error: true };
		}
	},
	newCommand(command, dimension = "overworld") {
		try {
			world.getDimension(dimension).runCommand(command);
			return false;
		} catch (error) {
			return true;
		}
	},
	/**
	 * Запукает массив команд
	 * @param {Array<string>} cmds
	 * @example rcs([
	 * 'clear "Smell of curry" diamond 0 0',
	 * 'say Smell of curry has a Diamond!'
	 * ]);
	 * @author Smell of curry
	 */
	rcs(cmds) {
		for (const cmd of cmds) {
			this.runCommand(cmd);
		}
	},
	/**
	 * Запускает массив команд на игроке
	 * @param {Array<String>} cmds
	 * @param {Player} player
	 */
	debug(cmds, player) {
		for (const cmd of cmds) {
			try {
				player.runCommand(cmd);
			} catch (error) {}
		}
	},
};
