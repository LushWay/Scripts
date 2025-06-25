import { Player } from '@minecraft/server'
import { LF, LoreForm } from 'lib/form/lore'
import { form, FormContext, NewFormCreator } from 'lib/form/new'
import { Npc } from './npc'
import { Place } from './place'

export type NpcFormCreator = (
  form: NewFormCreator,
  ctx: {
    npc: Npc
    lf: LF
  } & FormContext<undefined>,
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
    form((f, ctx) => {
      f.title(this.point.name)

      const lf = new LoreForm(this.point.id, f, player, this.showForm.bind(this))
      this.creator(f, { npc: this, lf, ...ctx })
      lf.renderHistory()
    }).show(player)
  }
}
