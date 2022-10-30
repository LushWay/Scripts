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
}

interface Array {
  /**
   * Неточно ищет строку в массиве
   * @param search Строка, которую надо найти
   */
  inaccurateSearch(search: string): [string, number][];
}

/*-----------------------------------------------*/

/**----------------------------------------------
 *                 Global types
 *-----------------------------------------------**/

interface Configuration {
  console: {
    /* Where you wanna see log messages */
    logPath: "chat" | "console" | "disabled";
    /* Where you wanna see error messages */
    errPath: "chat" | "console";
  };
  module: {
    /* Enables await on every module load */
    loadAwait: boolean;
  };
  commandPrefix: string;
}

interface Laungage {
  err: {};
}

interface ModuleOptions {
  /* Default:  "./modules/" */
  path?: string;
  /* Default: "index". YOU DONT NEED TO .js IN END OF FILENAME */
  fileName?: string;
  /* Default: true */
  condition?: boolean;
}

interface LightOption {
  value: 1 | 0;
}

interface Options {}

/*-----------------------------------------------*/
