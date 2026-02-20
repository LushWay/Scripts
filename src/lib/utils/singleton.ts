export class Singleton {
  private static instance?: Singleton

  private static where?: string

  static getInstance<T>(this: abstract new (...args: any) => T) {
    const self = this as unknown as typeof Singleton
    if (!self.instance) throw new Error('getInstance: ' + self.name + ' is not initialized!')
    return self.instance as T
  }

  constructor() {
    const singleton = this.constructor as typeof Singleton
    if (singleton.instance) {
      throw new Error(`${singleton.name} is already initialized! ${singleton.where}`)
    }

    const stack = new Error().stack

    singleton.instance = this
    singleton.where = stack

    let prototype
    let limit = 10
    do {
      prototype = Object.getPrototypeOf(prototype ?? singleton) as typeof Singleton
      if (prototype === Singleton) break

      prototype.instance ??= this
      prototype.where = stack
      limit--
    } while (limit)
  }
}
