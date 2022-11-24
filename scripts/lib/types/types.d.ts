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

interface IModuleOptions {
	/* Default:  "./modules/" */
	path?: string;
	/* Default: "index". YOU DONT NEED TO .js IN END OF FILENAME */
	fileName?: string;
	/* Default: true */
	condition?: boolean;
}

interface IColorScheme {
	function: {
		function: string;
		name: string;
		arguments: string;
		code: string;
		brackets: string;
	};
	nonstring: string;
	symbol: string;
	string: string;
}
