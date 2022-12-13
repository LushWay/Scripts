interface IConfiguration {
	console: {
		/* Where you wanna see log messages */
		logPath: "chat" | "console" | "disabled";
		/* Where you wanna see error messages */
		errPath: "chat" | "console";
	};
	chat: {
		cooldown: number;
		range: number;
	};
	module: {
		/* Enables await on every module load */
		loadAwait: boolean;
	};
	commandPrefix: string;
}
type Vector3 = import("@minecraft/server").Vector3;
interface IanyDB<K = string, V = any> {
	get(k: K): V;
	set(k: K): void;
	delete(k: K): boolean;
}
