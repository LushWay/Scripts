import { Player, world } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";

const gui = "xa:menu";

const menu = {
	home: () => {
		const a = new ActionFormData()
			.title("Меню")
			.button("Спавн")
			.button("Анархия")
			.button("Миниигры")
			.button("Статистика");

		return a;
	},
};

world.events.beforeItemUse.subscribe(async (d) => {
	if (d.item.typeId !== gui || !(d.source instanceof Player)) return;
	const res = await menu.home().show(d.source);
	if (res.canceled) return;
	switch (res.selection) {
		case 0:
			world.say("atp spawn");
			break;
		case 1:
			world.say("atp anarch");
			break;
		case 2:
			world.say("atp minigames");
			break;
		case 3:
			world.say("stats");
			break;
	}
});
