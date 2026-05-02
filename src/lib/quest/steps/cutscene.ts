import { Cutscene } from 'lib/cutscene'
import { PlayerQuest } from '../player'

export function QSCutscene(this: PlayerQuest, id: string, text: Text, options: Cutscene.Options = {}) {
  const fullId = this.quest.id + ' ' + id
  const cutscene = Cutscene.all.get(fullId) ?? new Cutscene(fullId, text, options)

  return this.dynamic(text).activate(ctx => {
    ctx.animateTicks = 0

    const play = cutscene.play(ctx.player)

    if (!play) {
      // Cutscene is not configured, skip
      return ctx.next()
    }

    play
      .catch((e: unknown) => {
        console.error('Cutscene error in quest', fullId, ctx.player.name, e)
      })
      .finally(() => {
        ctx.next()
      })
  })
}
