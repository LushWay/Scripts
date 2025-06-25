import { isNotPlaying } from 'lib/utils/game'
import { QS, QSBuilder } from '../step'

export class QSCounter extends QS<{ count: number }> {
  value = 0

  end = 1

  add(diff: number) {
    this.set(this.value + diff)
  }

  remove(diff: number) {
    this.set(this.value - diff)
  }

  protected set(value: number) {
    if (isNotPlaying(this.player)) return

    if (value < this.end) {
      // Saving value to db
      this.db ??= { count: value }
      this.db.count = value

      // Updating interface
      this.value = value
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

  description(desc: Text | ((count: number) => Text)) {
    this.step.description = typeof desc === 'function' ? () => desc(this.step.value) : () => desc
    return this
  }
}
