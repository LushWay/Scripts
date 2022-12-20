/**----------------------------------------------
 * QuickJS function, that not declared in es2020
 *-----------------------------------------------**/

interface Console {
	error(...data: any[]): void;
	info(...data: any[]): void;
	log(...data: any[]): void;
	warn(...data: any[]): void;
}

declare var console: Console;
