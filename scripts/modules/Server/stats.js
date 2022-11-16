import { ScoreboardDB } from "../../lib/Class/Options.js";

export const stats = {
	Bplace: new ScoreboardDB("blockPlace", "Поставлено блок"),
	Bbreak: new ScoreboardDB("blockBreak", "Сломано блоков"),
	FVlaunc: new ScoreboardDB("FVlaunc", "Фв запущено"),
	FVboom: new ScoreboardDB("FVboom", "Фв взорвано"),
	Hget: new ScoreboardDB("Hget", "Урона получено"),
	Hgive: new ScoreboardDB("Hgive", "Урона нанесено"),
	kills: new ScoreboardDB("kills", "Убийств"),
	deaths: new ScoreboardDB("deaths", "Смертей"),
};
