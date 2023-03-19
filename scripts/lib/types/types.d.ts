interface IConfiguration {
	// console: {
	// 	/* Where you wanna see log messages */
	// 	logPath: "chat" | "console" | "disabled";
	// 	/* Where you wanna see error messages */
	// 	errPath: "chat" | "console";
	// };
	chat: {
		cooldown: number;
		range: number;
	};
	module: {
		/* Enables await on every module load */
		loadAwait: boolean;
	};
	commandPrefix: string;
	/**
	 * Time in ms to mark XA.state.first_load
	 */
	firstPlayerJoinTime: number;
}
type Vector3 = import("@minecraft/server").Vector3;

interface IAbstactDatabase<Key = string, Value = any, DeleteReturn = any> {
	get(k: Key): Value;
	set(k: Key, v: Value): void;
	delete(k: Key): DeleteReturn;
}

type FunctionFilter<T> = {
	[K in keyof T as T[K] extends Function ? K : never]: T[K];
};

type ObjectWithFunction<T> = {
	[K in keyof T]: T[K] extends (...arg: any) => any ? K : never;
};
