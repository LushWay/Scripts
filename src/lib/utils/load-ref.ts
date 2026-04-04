import { system, world } from '@minecraft/server'
import { util } from 'lib/util'
import stringifyError from './error'

export class LoadRef<T> {
  static loadStarted = false

  static loadFinished = false

  static unwrap<T>(v: MaybeRef<T>): T {
    return v instanceof LoadRef ? v.value : v
  }

  protected static loaders: (() => void)[] = []

  static {
    world.afterEvents.worldLoad.subscribe(() => {
      LoadRef.loadStarted = true
      system.runJob(
        (function* loadRefJob() {
          for (const loader of LoadRef.loaders) {
            loader()
            yield
          }
          LoadRef.loadFinished = true
        })(),
      )
    })
  }

  get value(): T {
    throw new Error('Value is not yet loaded! Value defined at: \n' + this.stack)
  }

  private stack: string

  protected loaded = false

  constructor(loader: () => T) {
    this.stack = stringifyError.stack.get()
    LoadRef.loaders.push(() => {
      util.catch(
        () => {
          const value = loader()
          Object.defineProperty(this, 'value', { value })
          util.catch(
            () => {
              for (const waiter of this.waiters) waiter(value)
            },
            'LoadRefWaiterError',
            this.stack,
          )
          this.loaded = true
        },
        'LoadRefError',
        this.stack,
      )
    })
  }

  protected waiters: ((value: T) => void)[] = []

  onLoad = (waiter: (value: T) => void) => {
    if (this.loaded) return waiter(this.value)
    this.waiters.push(waiter)
  }
}

export type MaybeRef<T> = T | LoadRef<T>

export function onLoad<T>(loader: () => T) {
  if (LoadRef.loadStarted) {
    // console.log('LOADING', new Error())
    return {
      value: loader(),
      onLoad(v: (v: T) => void) {
        v(this.value)
      },
    }
  }

  return new LoadRef(loader)
}
