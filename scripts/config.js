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
		basic: 0,
	},
	world: {
		basic: 0,
		pos: 0,
		options: 0,
		region: 0,
		roles: 0,
	},
};
