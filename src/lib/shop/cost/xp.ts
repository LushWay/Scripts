import { Player } from '@minecraft/server'
import { i18n, l } from 'lib/i18n/text'
import { Cost } from './cost'

export class XPCost extends Cost {
  constructor(private levels: number) {
    super()
    this.levels = Math.round(this.levels)
    if (this.levels < 1) this.levels = 1
  }

  toString(_: Player, canBuy?: boolean): string {
    return l.colors({ text: canBuy ? '§7' : '§4', unit: canBuy ? '§a' : '§c' })`${this.levels.toString()}lvl`
  }

  has(player: Player): boolean {
    return player.level >= this.levels
  }

  failed(player: Player): string {
    const xp = player.level
    const lvl = this.levels
    return i18n.error`Нужно уровней опыта: ${lvl - xp}, ${xp}/${lvl}`.toString(player.lang)
  }

  take(player: Player) {
    player.addLevels(-this.levels)
  }
}
