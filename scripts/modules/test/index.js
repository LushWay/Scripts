import { Log, toStr, XA } from "xapi.js";
import {} from "@minecraft/server";
import { CommandCallback } from "../../lib/Command/Callback.js";

/**
 * @type {Object<string, (ctx: CommandCallback) => void>}
 */
const tests = {
  1: (ctx) => {
    const o = new XA.cacheDB(ctx.sender, "basic"),
      data = o.data;
    data.val = 34;
    data.ee = "ee";
    o.safe();
  },
  2: (ctx) => {
    const o = new XA.instantDB(ctx.sender, "basic").data;

    Log(toStr(o));
  },
  3: (ctx) => {},
};

const c = new XA.Command({
  name: "test",
});

c.int("number").executes((ctx, n) => {
  tests[n](ctx);
});
