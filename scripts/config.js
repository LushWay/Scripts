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
