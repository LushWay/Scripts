import { Player } from '@minecraft/server'
import { MaybeRawText, t } from 'lib/text'
import { Cost } from './cost'

export class XPCost extends Cost {
  constructor(private levels: number) {
    super()
    if (this.levels < 1) this.levels = 1
  }

  toString(canBuy?: boolean, player?: Player): MaybeRawText {
    return t.options({ text: canBuy ? '§7' : '§4', unit: canBuy ? '§a' : '§c' }).raw`${this.levels.toString()}lvl`
  }

  has(player: Player): boolean {
    return player.level >= this.levels
  }

  failed(player: Player): MaybeRawText {
    const xp = player.level
    const lvl = this.levels
    return t.error.raw`Нужно уровней опыта: ${(lvl - xp).toString()}§c, ${xp.toString()}/${lvl.toString()}`
  }

  buy(player: Player) {
    player.addLevels(-this.levels)
  }
}
