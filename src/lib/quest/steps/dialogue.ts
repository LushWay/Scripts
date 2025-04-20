import { ActionForm } from 'lib/form/action'
import { Npc } from 'lib/rpg/npc'
import { PlayerQuest } from '../player'
import { QSDynamic } from './dynamic'

export function QSDialogue(this: PlayerQuest, npc: Npc, text = `Поговорите с ${npc.name}`) {
  return {
    body: (body: string) => ({
      buttons: (...buttons: [string, (ctx: QSDynamic, back: VoidFunction) => void][]) => {
        const step = this.dynamic(text)
        if (npc.location.valid) step.place(npc.location)

        step.activate(ctx => {
          const show = () => {
            const form = new ActionForm(npc.name, body)

            for (const [text, callback] of buttons) {
              form.addButton(text, callback.bind(null, ctx, show))
            }

            form.show(this.player)
          }

          const interaction: Npc.OnInteract = event => {
            if (event.player.id !== this.player.id) return false
            show()
            return true
          }

          npc.questInteractions.add(interaction)
          return { cleanup: () => npc.questInteractions.delete(interaction) }
        })
      },
    }),
  }
}
