import { Player } from '@minecraft/server'
import { table } from 'lib/database/abstract'
import { t } from 'lib/text'
import { form, NewFormCreator } from './new'

interface LoreFormDb {
  seen: string[]
}

type AddFn = (f: NewFormCreator) => void

export type LF = Omit<LoreForm, 'renderHistory'>

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

  protected history: AddFn[] = []

  protected add(id: string, add: AddFn) {
    const seen = this.db.seen.includes(id)
    if (seen) {
      this.history.push(add)
    } else add(this.form)
  }

  question(id: string, name: string, answer: string): LoreForm {
    this.add(id, f => {
      f.button(
        form(f => {
          f.title(name)
          f.body(answer)
        }),
      )
    })
    return this
  }

  renderHistory() {
    this.form.button(
      form(f => {
        f.title(t.options({ num: '§f' }).badge`История ${this.history.length}`)
        for (const add of this.history) add(f)
      }),
    )
  }
}
