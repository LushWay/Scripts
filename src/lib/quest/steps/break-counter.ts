import { BlockPermutation } from '@minecraft/server'
import { Sounds } from 'lib/assets/custom-sounds'
import { QSCounter, QSCounterBuilder } from './counter'

export class QSBreakCounter extends QSCounter {}

export class QSBreakCounterBuilder extends QSCounterBuilder {
  filter(filter: (brokenBlockPermutation: BlockPermutation) => boolean, onBreak?: VoidFunction) {
    this.activate(ctx => {
      ctx.world.afterEvents.playerBreakBlock.subscribe(event => {
        if (event.player.id !== this.step.player.id) return
        if (!filter(event.brokenBlockPermutation)) return

        this.step.player.playSound(Sounds.Success)
        ctx.add(1)
        onBreak?.()
      })
    })

    return this
  }
}
