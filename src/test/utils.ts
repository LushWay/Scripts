/* eslint-disable @typescript-eslint/naming-convention */

import { Player } from '@minecraft/server'
import type { TestFormCallback, TFD } from 'test/__mocks__/minecraft_server-ui'

export function TEST_createPlayer() {
  // @ts-expect-error Yes. We can do this
  return new Player() as Player
}

export interface TestPlayer extends Player {
  onForm?: { [K in keyof TFD]?: TestFormCallback<K> }
}

interface RejectableFunction<T extends keyof TFD> extends TestFormCallback<T> {
  reject?: (error: Error) => void
}

export function TEST_onFormOpen<T extends keyof TFD>(player: Player, kind: T, callback: TestFormCallback<T>) {
  const onForm = ((player as TestPlayer).onForm ??= {})
  const previousCallback = onForm[kind] as RejectableFunction<T> | undefined
  previousCallback?.reject?.(new Error('Form listen request was canceled by next call'))

  const { resolve, reject, promise } = Promise.withResolvers<void>()
  const wrappedCallback: RejectableFunction<T> = (...args) => {
    delete wrappedCallback.reject
    resolve()
    return callback(...args)
  }
  wrappedCallback.reject = reject

  // eslint-disable-next-line @typescript-eslint/non-nullable-type-assertion-style
  ;(onForm[kind] as TestFormCallback<T>) = wrappedCallback

  return promise
}
