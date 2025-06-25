import { Player } from '@minecraft/server'
import { table } from 'lib/database/abstract'
import { i18n } from 'lib/i18n/text'
import { form, NewFormCallback, NewFormCreator } from './new'

interface LoreFormDb {
  seen: string[]
}

type AddFn = (f: NewFormCreator) => void

export type LF = Omit<LoreForm, 'renderHistory'>

export class LoreForm {
  static db = table<LoreFormDb>('loreForm', () => ({ seen: [] }))

  static list: LoreForm[] = []

  static getAll(playerId: string) {
    return this.list.map(e => LoreForm.db.get(`${e.id} ${playerId}`))
  }

  constructor(
    protected id: string,
    protected form: NewFormCreator,
    protected player: Player,
    protected back: NewFormCallback,
  ) {
    this.db = LoreForm.db.get(`${id} ${player.id}`)
    LoreForm.list.push(this)
  }

  protected db: LoreFormDb

  protected history: AddFn[] = []

  protected add(id: string, add: AddFn) {
    const seen = this.db.seen.includes(id)
    if (seen) {
      this.history.push(add)
    } else add(this.form)
  }

  question(id: string, name: Text, answer: Text): LoreForm {
    this.add(id, f => {
      f.button(name, player =>
        form(f => {
          f.title(name)
          f.body(answer)
          f.button(i18n`Хорошо, назад`, this.back)
          this.db.seen.push(id)
        }).show(player),
      )
    })
    return this
  }

  renderHistory() {
    this.form.button(
      form(f => {
        f.title(i18n`История`.size(this.history.length))
        for (const add of this.history) add(f)
      }),
    )
  }
}
