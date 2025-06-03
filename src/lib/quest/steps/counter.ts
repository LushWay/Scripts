import { isNotPlaying } from 'lib/utils/game'
import { QS, QSBuilder } from '../step'

export class QSCounter extends QS<{ count: number }> {
  value = 0

  end = 1

  diff(diff: number) {
    if (isNotPlaying(this.player)) return
    const result = this.value + diff

    if (result < this.end) {
      // Saving value to db
      this.db ??= { count: result }
      this.db.count = result

      // Updating interface
      this.value = result
      this.update()
    } else {
      this.next()
    }
  }

  protected activate() {
    if (typeof this.db?.count === 'number') this.value = this.db.count
  }
}

export class QSCounterBuilder extends QSBuilder<QSCounter> {
  create([text, end]: [text: (current: number, end: number) => Text, end: number]) {
    super.create([() => text(this.step.value, this.step.end)])
    this.step.end = end
  }

  value(value: number) {
    this.step.value = value
    return this
  }

  description(desc: string | ((count: number) => string)) {
    this.step.description = typeof desc === 'string' ? () => desc : () => desc(this.step.value)
    return this
  }
}
