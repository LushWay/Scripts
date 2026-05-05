import { Player, system, TicksPerSecond } from '@minecraft/server'
import { isNotPlaying } from 'lib/utils/game'
import { Quest } from './quest'
import { QS, QSBuilder } from './step'

import { EventLoader, EventLoaderWithArg } from 'lib/event-signal'
import { i18n } from 'lib/i18n/text'
import { VectorInDimension } from 'lib/utils/point'
import { QSBreakCounter, QSBreakCounterBuilder } from './steps/break-counter'
import { QSButton, QSButtonBuilder } from './steps/button'
import { QSCounter, QSCounterBuilder } from './steps/counter'
import { QSCutscene, QSCutsceneBuilder } from './steps/cutscene'
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

  reachArea = QSReachArea.bind(this)

  reachRegion = QSReachRegion.bind(this)

  dialogue = QSDialogue.bind(this)

  button = this.wrapStep(QSButtonBuilder, QSButton)

  cutscene = this.wrapStep(QSCutsceneBuilder, QSCutscene)

  nextQuest(quest: Quest) {
    this.dynamic(quest.id).activate(ctx => {
      ctx.next()
      quest.enter(this.player)
    })
  }

  subQuest(target: Quest, goGetQuestText = i18n`Возьмите задание ${target.name}`, goGetLocation?: VectorInDimension) {
    return this.dynamic(() =>
      target.isCompleted(this.player)
        ? 'ERROR quest is completed: ' + target.id
        : !target.hadEntered(this.player)
          ? goGetQuestText
          : i18n`Завершите задание ${target.name}`,
    ).activate(ctx => {
      if (target.isCompleted(this.player)) {
        // Completed, skip
        ctx.next()
      } else if (!target.hadEntered(this.player)) {
        // Not yet entered, point to a location
        if (goGetLocation) ctx.target = goGetLocation
      } else {
        // Wait for completion
        ctx.subscribe(Quest.onEnd, ({ quest, player }) => {
          console.log('ABC', quest.id, target.id)
          if (quest !== target || player.id !== this.player.id) return

          // To not spam with quests
          system.delay(() => ctx.next())
        })
      }
    })
  }

  failed = (reason: Text, exit = false) => {
    Quest.logger.error(this.quest.id, reason)
    return this.dynamic(reason).activate(ctx => {
      ctx.error(reason)
      if (exit) this.quest.exit(this.player)
    })
  }

  waitForLoad(loader: { onLoad(v: VoidFunction): void } | EventLoader | EventLoaderWithArg<any>) {
    return new Promise<void>((resolve, reject) => {
      if (loader instanceof EventLoaderWithArg || loader instanceof EventLoader) {
        loader.subscribe(resolve)
      } else {
        loader.onLoad(resolve)
      }

      system.runTimeout(
        () => reject(new Error('Quest.waitForLoad timeout: ' + this.quest.id)),
        'Quest.waitForLoad timeout',
        TicksPerSecond * 5,
      )
    })
  }

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

/** Used during initizalization to load cutscenes defined in quest steps */
export class PlayerQuestStub extends PlayerQuest {}
