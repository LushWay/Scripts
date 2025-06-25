import { Player } from '@minecraft/server'
import { isNotPlaying } from 'lib/utils/game'
import { Quest } from './quest'
import { QS, QSBuilder } from './step'

import { QSBreakCounter, QSBreakCounterBuilder } from './steps/break-counter'
import { QSButton, QSButtonBuilder } from './steps/button'
import { QSCounter, QSCounterBuilder } from './steps/counter'
import { QSDialogue } from './steps/dialogue'
import { QSDynamic, QSDynamicBuilder } from './steps/dynamic'
import { QSItem, QSItemBuilder } from './steps/item'
import { QSReachArea } from './steps/reach-area'
import { QSReachRegion } from './steps/reach-region'

export class PlayerQuest {
  constructor(
    public quest: Quest,
    public player: Player,
  ) {}

  steps: QS[] = []

  updateListeners = new Set<PlayerCallback>()

  dynamic = this.wrapStep(QSDynamicBuilder, QSDynamic)

  item = this.wrapStep(QSItemBuilder, QSItem)

  counter = this.wrapStep(QSCounterBuilder, QSCounter)

  breakCounter = this.wrapStep(QSBreakCounterBuilder, QSBreakCounter)

  failed = (reason: Text, exit = false) => {
    return this.dynamic(reason).activate(ctx => {
      ctx.error(reason)
      if (exit) this.quest.exit(this.player)
    })
  }

  reachArea = QSReachArea.bind(this)

  reachRegion = QSReachRegion.bind(this)

  dialogue = QSDialogue.bind(this)

  button = this.wrapStep(QSButtonBuilder, QSButton)

  end = (action: (ctx: PlayerQuest) => void) => {
    this.onEnd = action.bind(this, this) as VoidFunction
  }

  private onEnd: VoidFunction = () => false

  private next(step: QS, stepIndex: number) {
    if (isNotPlaying(this.player)) return
    step.cleanup()

    if (this.steps[stepIndex + 1]) {
      this.quest.setStep(this.player, stepIndex + 1)
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
      const index = this.steps.length
      const step: S = new Step(this.quest, this.player, this, () => this.next(step, index))
      const builder = new Builder(step)
      this.steps.push(step)
      builder.create(args)

      return builder as Omit<B, 'create'>
    }
  }
}
