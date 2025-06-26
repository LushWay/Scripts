import { ActionForm } from 'lib/form/action'
import { i18n } from 'lib/i18n/text'
import { Npc } from 'lib/rpg/npc'
import { PlayerQuest } from '../player'
import { QSDynamic } from './dynamic'

export function QSDialogue(this: PlayerQuest, npc: Npc, text = i18n.nocolor`Вас ждет §f${npc.name}`) {
  return this.dynamic(text)
    .target(npc.location.toPoint())
    .activate(ctx => {
      const interaction: Npc.OnInteract = event => {
        if (event.player.id !== this.player.id) return false
        ctx.next()
        return false
      }

      npc.questInteractions.add(interaction)
      return { cleanup: () => npc.questInteractions.delete(interaction) }
    })
}

export function QSDialogueOverride(this: PlayerQuest, npc: Npc, text = i18n.nocolor`Вас ждет §f${npc.name}`) {
  return {
    body: (body: string) => ({
      buttons: (...buttons: [string, (ctx: QSDynamic, back: VoidFunction) => void][]) => {
        this.dynamic(text)
          .target(npc.location.toPoint())
          .activate(ctx => {
            const show = () => {
              const form = new ActionForm(npc.name.to(this.player.lang), body)

              for (const [text, callback] of buttons) {
                form.button(text, callback.bind(null, ctx, show))
              }

              form.show(this.player)
            }

            const interaction: Npc.OnInteract = event => {
              if (event.player.id !== this.player.id) return false
              if (buttons.length === 0) {
                ctx.next()
                return false
              } else show()
              return true
            }

            npc.questInteractions.add(interaction)
            return { cleanup: () => npc.questInteractions.delete(interaction) }
          })
      },
    }),
  }
}
