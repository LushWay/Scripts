/** @type {IConfiguration} */
export const CONFIG = {
	console: {
		// Where you wanna see log messages
		logPath: "chat",
		// Where you wanna see error messages
		errPath: "chat",
	},
	module: {
		// Enables await on every module load
		loadAwait: true,
	},
	chat: {
		chatCooldown: 0, // this is a cool down when players type in chat
		range: 30,
	},
	commandPrefix: "-",
};

export const CONFIG_DB = {
	player: {
		basic: 2 ** 15,
	},
	world: {
		pos: 2 ** 10,
		chests: 2 ** 10,
		options: 2 ** 10,
		region: 2 ** 10,
		kits: 2 ** 10,
		chest: 2 ** 10,
		drop: 2 ** 10,
		roles: 2 ** 11,
		leaderboard: 2 ** 15,
		basic: 2 ** 10,
		buildRegion: 2 ** 11,
	},
};
