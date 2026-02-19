export class Singleton {
  private static instance?: Singleton

  static getInstance<T>(this: abstract new (...args: any) => T) {
    const self = this as unknown as typeof Singleton
    if (!self.instance) throw new Error('getInstance: ' + self.name + 'is not initialized!')
    return self.instance as T
  }

  constructor() {
    if ((this.constructor as typeof Singleton).instance) {
      throw new Error(this.constructor.name + ' is already initialized!')
    }

    ;(this.constructor as typeof Singleton).instance = this
  }
}
