import { Log, toStr, XA } from "xapi.js";
import {} from "@minecraft/server";
import { CommandCallback } from "../../lib/Command/Callback.js";

const tests = {
  /**
   *
   * @param {CommandCallback} ctx
   */
  1: (ctx) => {
    const o = new XA.cacheDB(ctx.sender, "basic"),
      data = o.data;
    data.val = 34;
    data.ee = "ee";
    o.safe();
  },

  /**
   *
   * @param {CommandCallback} ctx
   */
  2: (ctx) => {
    const o = new XA.instantDB(ctx.sender, "basic").data;

    Log(toStr(o));
  },
};

const c = new XA.Command({
  name: "DB",
});

c.int("n").executes((ctx, n) => {
  tests[n](ctx);
});
