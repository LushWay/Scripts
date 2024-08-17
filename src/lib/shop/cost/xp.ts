import { Player } from '@minecraft/server'
import { MaybeRawText, t } from 'lib/text'
import { Cost } from './cost'

export class XPCost extends Cost {
  constructor(private levels: number) {
    super()
  }

  toString(canBuy?: boolean, player?: Player): MaybeRawText {
    return t.options({ text: canBuy ? '§7' : '§4', unit: canBuy ? '§a' : '§c' }).raw`Опыт: ${this.levels.toString()}`
  }

  has(player: Player): boolean {
    console.log(player.getTotalXp() / player.totalXpNeededForNextLevel)
    return player.getTotalXp() >= this.levels
  }

  failed(player: Player): MaybeRawText {
    const xp = player.getTotalXp().toString()
    const lvl = this.levels.toString()
    return t.error.raw`Нужно уровней опыта: ${(Number(lvl) - Number(xp)).toString()}§c, ${xp}/${lvl}`
  }

  buy(player: Player): unknown {
    return player.runCommand(`xp -${this.levels}L`) // YES IT DOES NOT HAVE API
  }
}
