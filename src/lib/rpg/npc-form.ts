import { Player } from '@minecraft/server'
import { LF, LoreForm } from 'lib/form/lore'
import { form, NewFormCallback, NewFormCreator } from 'lib/form/new'
import { Npc } from './npc'
import { Place } from './place'

export type NpcFormCreator = (
  form: NewFormCreator,
  ctx: {
    npc: Npc
    player: Player
    back?: NewFormCallback
    lf: LF
  },
) => void

export class NpcForm extends Npc {
  constructor(point: Place, creator: NpcFormCreator) {
    super(point, ({ player }) => {
      form((f, _, back) => {
        f.title(point.name)

        const lf = new LoreForm(point.id, f, player)
        creator(f, { npc: this, player, back, lf })
        lf.renderHistory()
      }).show(player)
      return true
    })
  }
}
