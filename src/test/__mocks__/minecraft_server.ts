import { EventSignal } from 'lib/event-signal'
import { vi } from 'vitest'

export class Player {
  // @ts-expect-error AAAAAA
  static name() {
    return ''
  }

  teleport = vi.fn()
}

export class System {
  delay(fn: VoidFunction) {
    return this.run(fn)
  }

  run(fn: VoidFunction) {
    setImmediate(fn)
    return 0
  }
}

export const system = new System()

export class World {
  afterEvents = new WorldAfterEvents()
  beforeEvents = new WorldBeforeEvents()
}

export class WorldAfterEvents {
  readonly playerLeave = new EventSignal()
}
export class WorldBeforeEvents {}

export const world = new World()

export class ItemStack {
  constructor(public typeId: string) {}
  clone() {
    return new ItemStack(this.typeId)
  }
}
