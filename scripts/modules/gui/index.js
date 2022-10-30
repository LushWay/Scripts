import * as MCUI from "@minecraft/server-ui"
MCUI.FormCancelationReason
import { Player, world } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
import { Log, XA } from "xapi.js";

const gui = "mcbehub:gui";

const menu = {
  home: new ActionFormData()
    .title("Меню")
    .button("Спавн", "textures/blocks/beacon")
    .button("Анархия", "textures/blocks/grass")
    .button("Миниигры")
    .button("Статистика"),
};

world.events.beforeItemUse.subscribe(async (d) => {
  if (d.item.typeId != gui || !(d.source instanceof Player)) return;
  const res = await menu.home.show(d.source);
  if (res.canceled) return;
  switch (res.selection) {
    case 0:
      Log("atp spawn")
      break;

    case 1:
      Log("atp anarch")
      break;
    case 2:
      Log("atp minigames")
      break;
    case 3:
      Log("stats")
      break;
  }
});
