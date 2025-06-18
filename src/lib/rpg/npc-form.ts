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
  constructor(
    readonly point: Place,
    private creator: NpcFormCreator,
  ) {
    super(point, ({ player }) => {
      this.showForm(player)
      return true
    })
  }

  private showForm(player: Player) {
    form((f, _, back) => {
      f.title(this.point.name)

      const lf = new LoreForm(this.point.id, f, player, this.showForm.bind(this))
      this.creator(f, { npc: this, player, back, lf })
      lf.renderHistory()
    }).show(player)
  }
}
