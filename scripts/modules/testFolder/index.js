import { Log, toStr, XA } from "xapi.js";
import { __COMMANDS__ } from "../../lib/Command/index.js";

const a = new XA.Command({
  'name': 'name'
})

a.literal({
  'name': 'l1'
}).int('int').executes((ctx) => ctx.reply('l1 int'))

a.literal({
  'name': 'l2'
}).string('s').executes((ctx) => ctx.reply('l2 s'))

a.string('ss').executes((ctx) => ctx.reply('ss'))

Log(toStr(__COMMANDS__))