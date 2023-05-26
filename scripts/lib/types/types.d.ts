type Vector3 = import("@minecraft/server").Vector3;
type Vector2 = import("@minecraft/server").Vector2;
type Point = { x: number; z: number };
type Dimensions = import("@minecraft/server").ShortcutDimensions;

interface AbstactDatabase<Key = string, Value = any, DeleteReturn = any> {
	get(k: Key): Value;
	set(k: Key, v: Value): void;
	delete(k: Key): DeleteReturn;
}

type FunctionFilter<T> = {
	[K in keyof T as T[K] extends Function ? K : never]: T[K];
};

type JSONLike = Record<string | symbol | number, any>;

type AllTypes =
	| "string"
	| "number"
	| "object"
	| "boolean"
	| "symbol"
	| "bigint"
	| "undefined"
	| "function";
