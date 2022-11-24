import { setTickTimeout, XA } from "xapi.js";
import { OPTIONS, wo, WORLDOPTIONS } from "../../../lib/Class/XOptions.js";
import { Page } from "./modules/Models/Page.js";

/**
 * @param {string} string
 */
function perenos(string) {
	let count = 0;
	let maxC = 20;
	let output;
	for (let word of string.split(" ")) {
		count = count + word.cc().length;
		if (maxC <= count && word != "Экспериментальная" && word != "настройка" && word != "▲") {
			output = output + " \n" + word;
			count = 0;
		} else {
			let comma = output ? " " + word : " " + word;
			output = output + comma;
		}
	}
	return output.replace("undefined ", "");
}

/**
 * This is the deafult id of the page that when they open up the GUI for the first time it takes them to
 * so if it is home it will open up to home on the first time
 */
export const DEFAULT_STATIC_PAGE_ID = "set";
export const DEFAULT_STATIC_PAGE_ID2 = "worldsett";
const default_item = "minecraft:sculk_vein";

// 0  1  2  3  4  5  6  7  8
// 9  10 11 12 13 14 15 16 17
// 18 19 20 21 22 23 24 25 26
// 27 28 29 30 31 32 33 34 35
// 36 37 38 39 40 41 42 43 44
// 45 46 47 48 49 50 51 52 53

/**================================================================================================
 * *                                    Магаз
 *================================================================================================**/
let items = [
		{
			id: "minecraft:arrow",
			amount: 1,
			price: 1,
			data: 0,
			//name: ''
		},
		{
			id: "minecraft:carrot",
			amount: 64,
			price: 5,
			data: 0,
			//name: ''
		},
		{
			id: "minecraft:carrot",
			amount: 64,
			price: 5,
			data: 0,
			//name: ''
		},
		{
			id: "minecraft:carrot",
			amount: 64,
			price: 5,
			data: 0,
			//name: ''
		},
		{
			id: "minecraft:carrot",
			amount: 64,
			price: 5,
			data: 0,
			//name: ''
		},
		{
			id: "minecraft:carrot",
			amount: 64,
			price: 5,
			data: 0,
			//name: ''
		},
		{
			id: "minecraft:carrot",
			amount: 64,
			price: 5,
			data: 0,
			//name: ''
		},
		{
			id: "minecraft:carrot",
			amount: 64,
			price: 5,
			data: 0,
			//name: ''
		},
	],
	iPerPage = 2;
items.fill(
	{
		id: "minecraft:carrot",
		amount: 64,
		price: 5,
		data: 0,
		//name: ''
	},
	2,
	54
);

/**
 * @type {Array<Page>}
 */
export let shopPages = [];

for (let o = 1; o <= items.length / iPerPage; o++) {
	const pa = new Page(`shop${o}`, 54, "shop")
		.createItem(45, default_item, 1, 0, "set", " ")
		.createItem(46, default_item, 1, 0, "set", " ")
		.createItem(47, default_item, 1, 0, "set", " ")
		.createItem(48, default_item, 1, 0, "set", " ")
		.createItem(49, "minecraft:barrier", o, 0, "close", "§rЗакрыть")
		.createItem(50, default_item, 1, 0, "set", " ")
		.createItem(51, default_item, 1, 0, "set", " ")
		.createItem(52, default_item, 1, 0, "set", " ")
		.createItem(53, default_item, 1, 0, "set", " ");
	if (o - 1 > 0) pa.createItem(48, "minecraft:arrow", 1, 0, `page:shop${o - 1}`, "§rНазад");
	if (o + 1 <= items.length / iPerPage) pa.createItem(50, "minecraft:arrow", 1, 0, `page:shop${o + 1}`, "§rВперед");
	let e,
		start = o * iPerPage - iPerPage,
		end = o * iPerPage;
	items.length > iPerPage ? (e = items.slice(start, end)) : (e = items);
	for (const [i, p] of e.entries()) {
		pa.createItem(i, p.id, p.amount, p.data, "buy:" + p.price, p.name, XA.Lang.lang["shop.lore"](p.price, 0));
	}
	shopPages.push(pa);
}

/**================================================================================================
 **                                         Общедоступное меню
 *================================================================================================**/
const def = new Page(`set`, 54, "default")
	.createItem(0, default_item, 1, 0, "set", " ")
	.createItem(1, default_item, 1, 0, "set", " ")
	.createItem(2, default_item, 1, 0, "set", " ")
	.createItem(3, default_item, 1, 0, "set", " ")
	.createItem(9, default_item, 1, 0, "set", " ")
	.createItem(18, default_item, 1, 0, "set", " ")
	.createItem(27, default_item, 1, 0, "set", " ")
	.createItem(36, default_item, 1, 0, "set", " ")
	.createItem(17, default_item, 1, 0, "set", " ")
	.createItem(26, default_item, 1, 0, "set", " ")
	.createItem(35, default_item, 1, 0, "set", " ")
	.createItem(44, default_item, 1, 0, "set", " ")
	.createItem(4, default_item, 1, 0, "set", " ")
	.createItem(5, default_item, 1, 0, "set", " ")
	.createItem(6, default_item, 1, 0, "set", " ")
	.createItem(7, default_item, 1, 0, "set", " ")
	.createItem(8, default_item, 1, 0, "set", " ")
	.createItem(45, default_item, 1, 0, "set", " ")
	.createItem(46, default_item, 1, 0, "set", " ")
	.createItem(47, default_item, 1, 0, "set", " ")
	.createItem(48, default_item, 1, 0, "set", " ")
	.createItem(49, default_item, 1, 0, "set", " ")
	.createItem(50, default_item, 1, 0, "set", " ")
	.createItem(51, default_item, 1, 0, "set", " ")
	.createItem(52, default_item, 1, 0, "set", " ")
	.createItem(53, default_item, 1, 0, "set", " ")
	.createItem(38, "minecraft:ender_eye", 1, 0, "page:lich", "§r§5§l☼ §fНастройки §5§l☼", ["\n§r§7Настройки игрока"])
	.createItem(40, "minecraft:barrier", 1, 0, "close", "§rЗакрыть GUI");
if (wo.Q("server:spawn")) {
	def.createItem(22, "minecraft:beacon", 1, 0, "Atp:spawn", "На спавн", ["", "§r§7Переносит на спавн"]);
	def.createItem(20, "minecraft:tnt", 1, 0, "Atp:anarch", "Анархия", ["", "§r§7Переносит на анахрию"]);
	def.createItem(24, "minecraft:dragon_egg", 1, 0, "Atp:minigames", "Миниигры", ["", "§r§7Переносит на спавн миниигр"]);
}
if (wo.Q("timer:enable"))
	def.createItem(42, "reinforced_deepslate", 1, 0, "stats", "Статистика", ["", "§r§7Открывает меню\nсо статистикой"]);

export let lich = new Page(`lich`, 54, "spec")
	.createItem(45, default_item, 1, 0, "set", " ")
	.createItem(46, default_item, 1, 0, "set", " ")
	.createItem(47, default_item, 1, 0, "set", " ")
	.createItem(51, default_item, 1, 0, "set", " ")
	.createItem(52, default_item, 1, 0, "set", " ")
	.createItem(53, default_item, 1, 0, "set", " ")
	.createItem(48, "minecraft:coral", 1, 3, "sc:clear", "§r§lВосстановить по умолчанию", [
		"",
		"§r§7Очищает все настройки",
	])
	.createItem(49, "minecraft:barrier", 1, 0, "close", "§rЗакрыть")
	.createItem(50, "minecraft:ender_eye", 1, 0, "page:set", "§r§lНазад");
setTickTimeout(() => {
	let ind = 0;
	for (let s of OPTIONS) {
		lich.createItem(ind, `minecraft:white_candle`, 1, 0, "change", "§r" + s.name, ["\n§r§7" + perenos(s.desc)]);
		ind++;
	}
}, 10);

/*================================================================================================*/

/**================================================================================================
 **                                     Меню модеров
 *================================================================================================**/
new Page("moder_menu", 54, "default")
	.createItem(10, "minecraft:name_tag", 1, 0, "page:tags", "§rТэги", ["", "§7§rОткрывает меню с тэгами"])
	.createItem(12, "minecraft:writable_book", 1, 0, "page:text", "§rТекст", ["", "§7§rОткрывает меню летающего текста"])
	.createItem(14, "minecraft:gold_block", 1, 0, "page:lbs", "§r§6Таблица лидеров", [
		"",
		"§7§rОткрывает меню таблицы лидеров",
	])
	.createItem(16, "minecraft:skull", 1, 3, "set", "§r§6Меню игроков", ["", "§7§rОткрывает меню игроков"])
	.createItem(40, "minecraft:barrier", 1, 0, "close", "§rЗакрыть GUI");
new Page("tags", 54, "array:tags")
	.createItem(48, "minecraft:barrier", 1, 0, "close", "§rЗакрыть")
	.createItem(50, "minecraft:ender_eye", 1, 0, "page:moder_menu", "§r§lНазад");
new Page("text", 54, "array:text")
	.createItem(48, "minecraft:barrier", 1, 0, "close", "§rЗакрыть")
	.createItem(49, "minecraft:kelp", 1, 0, "spawn:ft", "§rСоздать текст")
	.createItem(50, "minecraft:ender_eye", 1, 0, "page:moder_menu", "§r§lНазад");
new Page("lbs", 54, "array:lbs")
	.createItem(48, "minecraft:barrier", 1, 0, "close", "§rЗакрыть")
	.createItem(49, "minecraft:kelp", 1, 0, "spawn:lb", "§rСоздать таблицу")
	.createItem(50, "minecraft:ender_eye", 1, 0, "page:moder_menu", "§r§lНазад");
/*================================================================================================*/

/**================================================================================================
 * *                                    Настройки мира
 *================================================================================================**/
export let auxa = new Page(`worldsett`, 54, "default")
	.createItem(45, default_item, 1, 0, "set", " ")
	.createItem(46, default_item, 1, 0, "set", " ")
	.createItem(47, "minecraft:shulker_box", 1, 0, "page:items", "§r§lПредметы", ["", "§r§7Сохраненные предметы"])
	.createItem(52, default_item, 1, 0, "set", " ")
	.createItem(53, default_item, 1, 0, "set", " ")
	.createItem(48, "minecraft:coral", 1, 3, "sc:clear", "§r§lОчистить все", ["", "§r§7Очищает все настройки"])
	.createItem(49, "minecraft:barrier", 1, 0, "close", "§rЗакрыть")
	.createItem(50, "minecraft:kelp", 1, 0, "sc:clear0", "§r§lОчистить 0", ["", "§r§7Очищает выключенные настройки"])
	.createItem(51, "minecraft:lectern", 1, 0, "page:perm", "§r§lРазрешения", ["", "§r§7Меню разрешений"]);

setTickTimeout(() => {
	let ind = 0;
	for (let s of WORLDOPTIONS) {
		if (s.name.startsWith("perm:")) {
			if (!wo.G(s.name)) wo.set(s.name, "");
			continue;
		}
		if (s.text) {
			auxa.createItem(ind, `minecraft:writable_book`, 1, 0, "open", "§r" + s.name, ["\n§r§7" + perenos(s.desc)]);
		} else {
			let item, action;
			if (s.name.startsWith("import")) {
				action = "change:grass:bedrock";
				item = `minecraft:${wo.Q(s.name) ? "grass" : "bedrock"}`;
			}
			if (s.name.startsWith("server")) {
				action = "change:warped_roots:crimson_roots";
				item = `minecraft:${wo.Q(s.name) ? "warped_roots" : "crimson_roots"}`;
			}
			if (!item) {
				action = "change:lime_candle:red_candle";
				item = `minecraft:${wo.Q(s.name) ? "lime" : "red"}_candle`;
			}
			auxa.createItem(ind, item, 1, 0, action, "§r" + s.name, ["\n§r§7" + perenos(s.desc)]);
		}
		ind++;
	}
}, 10);

export const pls = new Page(`perm`, 54, "players")
	.createItem(45, default_item, 1, 0, "set", " ")
	.createItem(46, default_item, 1, 0, "set", " ")
	.createItem(47, default_item, 1, 0, "set", " ")
	.createItem(48, "sa:a", 1, 3, "page:worldsett", "§r§lНазад")
	.createItem(49, default_item, 1, 0, "set", " ")
	.createItem(50, "minecraft:barrier", 1, 0, "close", "§rЗакрыть")
	.createItem(51, default_item, 1, 0, "set", " ")
	.createItem(52, default_item, 1, 0, "set", " ")
	.createItem(53, default_item, 1, 0, "set", " ");

export const предметы = new Page(`items`, 54, "items")
	.createItem(45, default_item, 1, 0, "set", " ")
	.createItem(46, default_item, 1, 0, "set", " ")
	.createItem(47, default_item, 1, 0, "set", " ")
	.createItem(48, "sa:a", 1, 3, "page:worldsett", "§r§lНазад")
	.createItem(49, default_item, 1, 0, "set", " ")
	.createItem(50, "minecraft:barrier", 1, 0, "close", "§rЗакрыть")
	.createItem(51, default_item, 1, 0, "set", " ")
	.createItem(52, default_item, 1, 0, "set", " ")
	.createItem(53, default_item, 1, 0, "set", " ");
