interface IConfiguration {
	console: {
		/* Where you wanna see log messages */
		logPath: "chat" | "console" | "disabled";
		/* Where you wanna see error messages */
		errPath: "chat" | "console";
	};
	chat: {
		chatCooldown: number;
		range: number;
	};
	module: {
		/* Enables await on every module load */
		loadAwait: boolean;
	};
	commandPrefix: string;
}
type Vector3 = import("@minecraft/server").Vector3;
