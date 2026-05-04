import { Cutscene } from 'lib/cutscene'

import { QS, QSBuilder } from '../step'

export class QSCutscene extends QS {
  cutscene!: Cutscene

  fullId!: string

  protected activate() {
    this.animateTicks = 0

    const play = this.cutscene.play(this.player)

    if (!play) {
      // Cutscene is not configured, skip
      return this.next()
    }

    play
      .catch((e: unknown) => {
        console.error('Cutscene error in quest', this.fullId, this.player.name, e)
      })
      .finally(() => {
        this.next()
      })
  }
}

export class QSCutsceneBuilder extends QSBuilder<QSCutscene> {
  create([id, text]: [id: string, text: Text]) {
    super.create([text])

    const fullId = this.step.quest.id + ' ' + id

    const options: Cutscene.Options = {}

    const prev = this.step.playerQuest.steps.at(-2) // -1 is this.step, -2 is step before
    if (prev instanceof QSCutscene) {
      prev.cutscene.options.restoreCameraTime = 0
      options.instantEnter = true
    }

    this.step.cutscene = Cutscene.all.get(fullId) ?? new Cutscene(fullId, text, options)
  }
}
