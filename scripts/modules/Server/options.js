import { world } from "@minecraft/server";
import { PlayerOption, po, wo, WorldOption } from "../../lib/Class/Options.js";

import { XA } from "xapi.js";

new WorldOption("simulatedplayer:name", "имя ботика", true);

new WorldOption("simulatedplayer:time", "время за компом у ботика", true);

new PlayerOption(
  "anarchy:hideCoordinates",
  "Скрывает координаты при телепортации на анархию"
);

new WorldOption("import:br", "Включает плагин батл рояля");

new WorldOption("perm:владельцы", 'Ники владельцев через ", "', true);
new WorldOption("perm:модеры", 'Ники модеров через ", "', true);
new WorldOption("perm:data", "JS data", true);

new WorldOption("chat:Cooldown", "0 что бы отключить (число)", true);
new WorldOption(
  "chat:range",
  "Радиус для затемнения сообщений дальних игроков (число)",
  true
);

new PlayerOption(
  "chat:highlightMessages",
  "Если включено, вы будете видеть свои сообщения в чате так: §l§6Я: §fСообщение§r"
);
new PlayerOption(
  "chat:sound:msgl:disable",
  "Отключает звук сообщений дальних игроков в чате"
);
new PlayerOption(
  "chat:sound:msgn:disable",
  "Отключает звук сообщений ближних игроков в чате"
);
// new PlayerOption(
//   "chat:sound:@:disable",
//   "Отключает звук упоминаний в чате"
// );
new PlayerOption(
  "another:join:disable",
  "§cВыключает§r чужие сообщения о входе"
);
new PlayerOption("joinsound:disable", "§cВыключает§r звук входа");

new WorldOption(
  "lock:nether",
  "Если эта настройка включена, порталы в незер будут автоматически ломаться"
);
new WorldOption("chat:ranks:disable", "Выключает ранги в чате");
new WorldOption(
  "server:bowhit",
  "§aВключает§7 звук попадания по энтити из лука"
);
if (wo.Q("server:bowhit")) {
  new PlayerOption(
    "pvp:bowhitsound",
    "§aВключает§7 звук попадания по энтити из лука"
  );
  new PlayerOption(
    "pvp:bowhittitle",
    "§aВключает§7 титл попадания по энтити из лука"
  );
}
new WorldOption(
  "server:pvpmode:enable",
  "§aВключает§7 возможность входа в пвп режим (блокировка всех тп команд)§r"
);
if (wo.Q("server:pvpmode:enable")) {
  new PlayerOption(
    "title:pvpmode",
    "Выводит надпись с временем пвп режима над хотбаром"
  );
  new WorldOption(
    "server:pvpmode:cooldown",
    "Определяет время пвп режима",
    true
  );
}
new WorldOption("timer:enable", "Включает таймер игрового времени");
new WorldOption("zone:center", "x y", true);
new WorldOption(
  "imports:clean",
  "Делает сообщения об импортах чище (включите при частой перезагрзуке)"
);
new WorldOption("import:wb", "Включает импорт WorldBuilder'a");
new WorldOption("debug:menu", "Выключает дебаг");

new WorldOption(
  "server:spawn",
  "Включает команду /hub, пункт в меню и приветствие.\n\n(требуется перезагрузка)"
);
if (wo.Q("server:spawn")) {
  new WorldOption("spawn:title", "Надпись при входе", true);

  new WorldOption("spawn:subtitle", "Надпись при входе", true);

  new WorldOption("spawn:actionbar", "Надпись при входе", true);
  new WorldOption("spawn:animcolor", "Цвет анимации (с §)", true);

  new WorldOption(
    "spawn:message",
    "Надпись при входе, заменяемые значения: \n§f$name§7 - имя игрока\n§f$время§7 - 'Добрый день' и тд\n§f$time§7 - 08:01",
    true
  );

  new PlayerOption(
    "title:spawn:enable",
    'Переводит надпись "Перемещено" в зону над хотбаром'
  );

  new PlayerOption("title:join:disable", "Выключает приветствие при входе");

  world.events.playerJoin.subscribe((PlayerJoinEvent) => {
    const pl = PlayerJoinEvent.player;
    if (XA.Entity.getScore(pl, "pvp") == 0) pl.removeTag("WSeenJoinMessage");
    XA.Entity.removeTagsStartsWith(pl, "joinedAt:");
    if (!po.Q("title:join:disable", pl) && XA.Entity.getScore(pl, "pvp") == 0)
      pl.addTag(
        "joinedAt:" + pl.location.x + " " + pl.location.y + " " + pl.location.z
      );
  });
  new WorldOption(
    "joinform:body",
    "Сообщение при первом входе. Параметры: $name, $time",
    true
  );
}
