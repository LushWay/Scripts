import * as mc from "@minecraft/server";
declare global {
	interface Console {
		error(...data: any[]): void;
		info(...data: any[]): void;
		log(...data: any[]): void;
		warn(...data: any[]): void;
		debug(...data: any[]): void;
		verbose(...data: any[]): void;
	}

	var console: Console;
	var nextTick: Promise<void>;
	var verbose: boolean;

	interface JSON {
		/**
		 * Parses string and catches any error. If callback param is specified, it will be called with catched error. For more info see {@link JSON.parse}
		 */
		safeParse(
			text: string,
			reciever?: (this: any, key: string, value: any) => any,
			errorCallback?: (error: Error) => any,
		): any;
	}

	interface ArrayConstructor {
		/**
		 * Checks if two arrays are the same
		 * @param one
		 * @param two
		 */
		equals(one: any[], two: any[]): boolean;
	}

	interface Function {
		bind<fn extends Function>(this: fn, context: object, args: any): fn;
	}

	interface Array<T> {
		/**
		 * Returns random array element. Alias to
		 * ```js
		 * array[Math.randomInt(0, array.length - 1)]
		 * ```
		 */
		randomElement(): T;
	}

	interface Math {
		randomInt(minimum: number, maximum: number): number;
		randomFloat(minimum: number, maximum: number): number;
	}

	interface ObjectConstructor {
		keys<T extends object>(o: T): Array<keyof T>;
	}

	type Vector3 = mc.Vector3;
	type Vector2 = mc.Vector2;
	type Point = { x: number; z: number };
	type Dimensions = mc.ShortcutDimensions;

	interface AbstactDatabase<Key = string, Value = any, DeleteReturn = any> {
		get(k: Key): Value;
		set(k: Key, v: Value): void;
		delete(k: Key): DeleteReturn;
	}

	type JSONLike = Record<string | symbol | number, any>;

	type RandomCostMapType = {
		[key: `${number}...${number}` | number]: percent;
	};

	type Range<F extends number, T extends number> =
		| Exclude<Enumerate<T>, Enumerate<F>>
		| T;

	type Enumerate<
		N extends number,
		Acc extends number[] = [],
	> = Acc["length"] extends N
		? Acc[number]
		: Enumerate<N, [...Acc, Acc["length"]]>;

	type percent = `${number}%`;

	type PlayerDB<Value = any> = { save(): void; data: Value };

	type PartialParts<b, thisArg = b> = {
		[P in keyof b]?: b[P] extends (...param: infer param) => infer ret
			? (this: thisArg, ...param: param) => ret
			: b[P];
	};
}

declare module "@minecraft/server" {
	type ScoreNames = "money" | "leafs";
	interface Player {
		scores: Record<ScoreNames, number>;
		database:
			| {
					key: {
						value: number;
					};
			  }
			| Record<string, JSONLike>;
	}
}
