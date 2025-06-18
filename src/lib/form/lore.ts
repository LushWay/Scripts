import { Player } from '@minecraft/server'
import { table } from 'lib/database/abstract'
import { NewFormCreator } from './new'

interface LoreFormDb {
  seen: string[]
}

export class LoreForm {
  static db = table<LoreFormDb>('loreForm', () => ({ seen: [] }))

  constructor(
    protected id: string,
    protected form: NewFormCreator,
    protected player: Player,
  ) {
    this.db = LoreForm.db.get(`${id} ${player.id}`)
  }

  protected db: LoreFormDb

  protected questsions: { id: string; name: string; answer: string }[] = []

  question(id: string, name: string, answer: string): LoreForm {
    return this
  }

  render() {
    for (const question of this.questsions) {
      if (this.db.seen.includes(question.id)) {
      }
    }
  }
}
