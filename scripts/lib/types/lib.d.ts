/**----------------------------------------------
 * QuickJS function, that not declared in es2020
 *-----------------------------------------------**/

interface IConsole {
	error(...data: any[]): void;
	info(...data: any[]): void;
	log(...data: any[]): void;
	warn(...data: any[]): void;
}

declare var console: IConsole;

/*-----------------------------------------------*/

/**----------------------------------------------
 *                  Prototypes
 *-----------------------------------------------**/

interface String {
	/**
	 * Неточно сравнивает строку и выдает значение показывающеее их схожесть.
	 * @param search Строка, которую нужно сравнить
	 */
	similiarTo(search: string): number;
	/**
	 * Clears all § colos from string
	 */
	cc(): string;
}

interface Array {
	/**
	 * Неточно ищет строку в массиве
	 * @param search Строка, которую надо найти
	 */
	inaccurateSearch(search: string): [string, number][];
}
