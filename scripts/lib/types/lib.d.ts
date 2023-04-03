/**----------------------------------------------
 * QuickJS function, that not declared in es2020
 *-----------------------------------------------**/

interface Console {
	error(...data: any[]): void;
	info(...data: any[]): void;
	log(...data: any[]): void;
	warn(...data: any[]): void;
	debug(...data: any[]): void;
}

declare var console: Console;

interface JSON {
	/**
	 * Parses string and catches any error. If callback param is specified, it will be called with catched error. For more info see {@link JSON.parse}
	 */
	safeParse(
		text: string,
		reciever?: (this: any, key: string, value: any) => any,
		errorCallback?: (error: Error) => any
	): any;
}

interface Function {
	typedBind<fn extends Function>(this: fn, context: object): fn;
}

interface ArrayConstructor {
	/**
	 * Checks if two arrays are the same
	 * @param one
	 * @param two
	 */
	equals(one: any[], two: any[]): boolean;
}
