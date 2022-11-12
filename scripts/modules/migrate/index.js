import { XA } from "xapi.js";
import { world } from "@minecraft/server";

const db = new XA.cacheDB(world, "options");

const data = {
	"chat:range": 40,
	"chat:Cooldown": 0,
	"spawn:pos": "-462 244 730",
	"aa:save": "список постоек на спавне",
	"anarch:pos": "-453 243 762",
	"minigames:pos": "10000 245 10000",
	"perm:data": 19715,
	"spawn:title": "§aShpinat §6Mine",
	"spawn:subtitle": "§3Привет!",
	"zone:center": "-4500, -4500",
	"br:pos": "6737 -14 9142",
	"br:time": "15:00",
	"br:gamepos": "6775 9261",
	"simulatedplayer:name": "ботик",
	"simulatedplayer:time": "100000",
};
for (const key in data) {
	db.data[key] = data[key];
}
db.safe();
