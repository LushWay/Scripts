export const text = {
  "title.kill.bow": (a) => `§gВы застрелили §6${a}`,
  "title.kill.hit": (a) => `§gВы убили §6${a}`,
  "api.name": () => "Smelly API",
  "api.error.unknown": () => "An unknown error has occured.",
  "api.database.error.table_name": (a, b) =>
    `The display name ${a} is too long for an objective, it can be at most ${b} characters long`,
  "api.utilities.formatter.error.ms": (a) => `${a} is not a string or a number`,
  "api.Providers.form.invaildtype": (a, b) =>
    `Type ${a} is not a vaild type to add a ${b}`,
  "api.Providers.form.invaildFormtype": (a, b) => {
    `The type ${a} is not a valid type, Vaild types: ${JSON.stringify(b)}`;
  },

  "br.start": (a, b, c) =>
    `§7│----------------\n│§6  Игра началась!\n§7│----------------\n│  §eНаграда за победу: §f${a} §a(S)\n§7│  §e►§f ${b}\n§7│§e  Зона:§f ${c}\n§7│`,
  "br.end.time": (a) =>
    `§7│----------------\n│§6  Время вышло!\n§7│----------------\n│  §e►§f ${a}\n§7│`,
  "br.end.spec": (a) =>
    `§7│----------------\n│§6  Игра остановлена.\n§7│----------------\n│  §eПричина: §f${a}\n§7│`,
  "br.end.winner": (a) =>
    `§7│----------------\n│§6  Ты победил!\n§7│----------------\n│  §eНаграда: §f${a} §a(S)\n§7│`,
  "br.end.looser": (a, b) =>
    `§7│----------------\n│§c  Ты проиграл!\n§7│----------------\n│  §eПобедил:§f ${a}, §eзабрав награду в §f${b} §a(S)\n§7│`,
  "br.end.draw": () => `§7│----------------\n│  §eНичья!\n§7│----------------`,
  "shop.lore": (price, balance) => [
    "§7----------",
    ` §${balance >= price ? "f§r" : "c"}Цена: ${price}`,
    `§r Баланс: ${balance}`,
    "§7----------§{§-§}",
  ],

  "shop.notenought": (price, balance) =>
    `§c☼ Недостаточно средств (Цена: §f${price} §c Баланс: §f${balance}§c)`,
  "shop.suc": (a, b, price, balance) =>
    `§a☼ §fУспешная покупка ${a} х${b} §7(Цена: §f${price} §7 Баланс: §f${balance}§7)`,

  stats: (
    hrs,
    min,
    sec,
    ahrs,
    amin,
    asec,
    dhrs,
    dmin,
    dsec,
    kills,
    deaths,
    hget,
    hgive,
    bplace,
    Bbreak,
    fla
  ) =>
    `§8-----------------------------
  §7Время всего: §f${hrs}:${min}:${sec}
  §7Время на анархии: §f${ahrs}:${amin}:${asec}
  §7Время за день: §f${dhrs}:${dmin}:${dsec}
§8-----------------------------
  §fУбийств: §6${kills}
  §fСмертей: §c${deaths}
  §6K§f/§cD: §f${kills / deaths}

  §fУрона нанесено: §g${hgive}
  §fУрона получено: §4${hget}
  §gН§f/§4П: §f${hgive / hgive}
§8-----------------------------
  §fБлоков поставлено: §d${bplace}
  §fБлоков сломано: §5${Bbreak}
    
  §fФейрверков запущено: §9${fla}
§8-----------------------------`,
};

//комент
