/** @type {Configuration} */
export const CONFIG = {
  console: {
    // Where you wanna see log messages
    logPath: "chat",
    // Where you wanna see error messages
    errPath: "chat",
  },
  module: {
    // Enables await on every module load
    loadAwait: true,
  },
  commandPrefix: "-",
};

export const CONFIGDB = {
  player: {
    test: "t",
  },
  world: {
    basic: "default",
    pos: "pos",
  },
};
