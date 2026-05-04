import { system, world } from '@minecraft/server'
import { util } from 'lib/util'
import stringifyError from './error'

export class LoadRef<T> {
  static loadStarted = false

  static loadFinished = false

  static unwrap<T>(v: MaybeRef<T>): T {
    return v instanceof LoadRef ? v.value : v
  }

  protected static loaders: LoadRef<any>[] = []

  static {
    world.afterEvents.worldLoad.subscribe(() => {
      LoadRef.loadStarted = true
      system.runJob(
        (function* loadRefJob() {
          for (const ref of LoadRef.loaders.sort((a, b) => a.priority - b.priority)) {
            // const start = Date.now()
            // const name = ref.loader.toString().replaceAll('\n', '').replaceAll(/\s\s+/g, ' ').slice(0, 100)
            // console.log('LOADING', OnLoadPriority[ref.priority], name)
            ref.loaderWithCatch()
            // console.log('LOADED', Date.now() - start, name)
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

  protected loaderWithCatch: VoidFunction

  constructor(
    protected loader: () => T,
    protected priority: OnLoadPriority,
  ) {
    this.stack = stringifyError.stack.get(2)
    this.loaderWithCatch = () => {
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
    }

    LoadRef.loaders.push(this)
  }

  protected waiters: ((value: T) => void)[] = []

  onLoad = (waiter: (value: T) => void) => {
    if (this.loaded) return waiter(this.value)
    this.waiters.push(waiter)
  }
}

export type MaybeRef<T> = T | LoadRef<T>

export enum OnLoadPriority {
  Enviroment = 1,
  Database = 2,
  Important = 3,
  NonImportant = 4,
}

export function onLoad<T>(loader: () => T, priority = OnLoadPriority.NonImportant) {
  if (LoadRef.loadStarted) {
    // console.log('LOADING', new Error())
    return {
      value: loader(),
      onLoad(v: (v: T) => void) {
        v(this.value)
      },
    }
  }

  return new LoadRef(loader, priority)
}
