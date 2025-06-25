import { i18n } from "lib/i18n/text"

export const text: Record<string, (...args: (string | number)[]) => string> = {
  'api.name': () => 'Smelly API',
  'api.error.unknown': () => 'An unknown error has occured.',

  'br.start': (a, b, c) =>
    `§7│----------------\n│§6  Игра началась!\n§7│----------------\n│  §eНаграда за победу: §f${a} §a(S)\n§7│  §e►§f ${b}\n§7│§e  Зона:§f ${c}\n§7│`,

  'br.end.time': a => `§7│----------------\n│§6  Время вышло!\n§7│----------------\n│  §e►§f ${a}\n§7│`,

  'br.end.spec': a => `§7│----------------\n│§6  Игра остановлена.\n§7│----------------\n│  §eПричина: §f${a}\n§7│`,

  'br.end.winner': a => `§7│----------------\n│§6  Ты победил!\n§7│----------------\n│  §eНаграда: §f${a} §a(S)\n§7│`,

  'br.end.looser': (a, b) =>
    `§7│----------------\n│§c  Ты проиграл!\n§7│----------------\n│  §eПобедил:§f ${a}, §eзабрав награду в §f${b} §a(S)\n§7│`,
  'br.end.draw': () => `§7│----------------\n│  §eНичья!\n§7│----------------`,

  // @ts-expect-error huuuuuuuuuh
  'stats': (
    hrs,
    min,
    sec,
    ahrs,
    amin,
    asec,
    dhrs,
    dmin,
    dsec,
    kills: number,
    deaths: number,
    hget: number,
    hgive: number,
    bplace,
    Bbreak,
    fla,
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
}

export const developersAreWarned = i18n`Разработчики уже оповещены о проблеме и работают над ее исправлением.`
