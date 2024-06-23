import { Player } from '@minecraft/server'
import { isNotPlaying } from 'lib/game-utils'
import { Quest } from './quest'
import { QS, QSBuilder } from './step'

import { QSCounter, QSCounterBuilder } from './steps/counter'
import { QSDynamic, QSDynamicBuilder } from './steps/dynamic'
import { QSItem, QSItemBuilder } from './steps/item'
import { QSPlace } from './steps/place'

export class PlayerQuest {
  constructor(
    public quest: Quest,
    public player: Player,
  ) {}

  list: QS[] = []

  updateListeners = new Set<PlayerCallback>()

  dynamic = this.wrapStep(QSDynamicBuilder, QSDynamic)

  item = this.wrapStep(QSItemBuilder, QSItem)

  counter = this.wrapStep(QSCounterBuilder, QSCounter)

  failed = (reason: string) => {
    return this.dynamic(reason).activate(ctx => ctx.error(reason))
  }

  place = QSPlace.bind(this)

  end = (action: (ctx: PlayerQuest) => void) => {
    this.onEnd = action.bind(this, this) as VoidFunction
  }

  private onEnd: VoidFunction = () => false

  private next(step: QS, index: number) {
    if (isNotPlaying(this.player)) return
    step.cleanup()

    if (this.list[index + 1]) {
      this.quest.setStep(this.player, index + 1)
    } else {
      this.quest.exit(this.player, true)
      this.onEnd()
      this.quest.players.delete(this.player.id)
    }

    this.update()
  }

  update() {
    this.updateListeners.forEach(e => e(this.player))
  }

  private wrapStep<S extends QS, B extends QSBuilder<S>>(Builder: new (step: S) => B, Step: new (...args: any[]) => S) {
    return (...args: Parameters<B['create']>[0]) => {
      const index = this.list.length
      const step: S = new Step(this.quest, this.player, this, () => this.next(step, index))
      const builder = new Builder(step)
      this.list.push(step)
      builder.create(args)

      return builder as Omit<B, 'create'>
    }
  }
}
