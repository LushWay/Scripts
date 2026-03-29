import { Cutscene } from 'lib/cutscene'
import { PlayerQuest } from '../player'

export function QSCutscene(this: PlayerQuest, cutscene: Cutscene, text: Text) {
  return this.dynamic(text).activate(ctx => {
    ctx.animateTicks = 0

    const play = cutscene.play(ctx.player)

    if (!play) {
      // Cutscene is not configured, skip
      return ctx.next()
    }

    play
      .catch((e: unknown) => {
        console.error('Cutscene error in quest', this.quest.id, ctx.player.name, e)
      })
      .finally(() => {
        ctx.next()
      })
  })
}
