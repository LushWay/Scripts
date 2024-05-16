export class Player {
  // @ts-expect-error AAAAAA
  static name() {
    return ''
  }
}

export class System {
  delay(fn: VoidFunction) {
    return this.run(fn)
  }

  run(fn: VoidFunction) {
    // @ts-expect-error
    setImmediate(fn)
    return 0
  }
}

export const system = new System()
