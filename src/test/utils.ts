/* eslint-disable @typescript-eslint/naming-convention */

import { Player, system } from '@minecraft/server'
import { EventSignal } from 'lib'
import type { Table } from 'lib/database/abstract'
import type { TestFormCallback, TFD } from 'test/__mocks__/minecraft_server-ui'

interface MinecraftEventSignal<T> {
  subscribe(callback: (arg0: T) => void, ...args: unknown[]): (arg0: T) => void
  unsubscribe(callback: (arg0: T) => void): void
}

export function TEST_emitEvent<T>(eventSignal: MinecraftEventSignal<T>, data: T) {
  // @ts-expect-error We use our standart signals
  EventSignal.emit(eventSignal, data)
}

export function TEST_clearDatabase(database: Table<any>) {
  for (const key of database.keys()) database.delete(key)
}

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

export function TEST_onFormOpen<T extends keyof TFD>(
  player: Player,
  kind: T,
  callback: TestFormCallback<T>,
  beforeReturn?: VoidFunction,
) {
  const onForm = ((player as TestPlayer).onForm ??= {})
  const previousCallback = onForm[kind] as RejectableFunction<T> | undefined
  previousCallback?.reject?.(new Error('Form listen request was canceled by next call'))

  const { resolve, reject, promise } = Promise.withResolvers<void>()
  const wrappedCallback: RejectableFunction<T> = (...args) => {
    delete wrappedCallback.reject
    resolve()
    beforeReturn?.()
    return callback(...args)
  }
  wrappedCallback.reject = reject

  // eslint-disable-next-line @typescript-eslint/non-nullable-type-assertion-style
  ;(onForm[kind] as TestFormCallback<T>) = wrappedCallback

  return promise
}

type FormListener<T extends keyof TFD> = [kind: T, callback: TestFormCallback<T>]

type FormsListeners<T extends keyof TFD> = FormListener<T>[]

async function form<T extends keyof TFD>(player: Player, form: VoidFunction, ...forms: FormsListeners<T>) {
  const promise = Promise.withResolvers<void>()
  wrapInfinity(player, forms, () => system.run(promise.resolve), promise.reject)
  catchE(form, promise.reject)
  await promise.promise
}

form.action = (callback: TestFormCallback<'action'>) => ['action', callback] satisfies FormListener<'action'>
form.message = (callback: TestFormCallback<'message'>) => ['message', callback] satisfies FormListener<'message'>
form.modal = (callback: TestFormCallback<'modal'>) => ['modal', callback] satisfies FormListener<'modal'>

export const test = {
  createPlayer: TEST_createPlayer,
  form: form,
}

async function catchE(v: () => MaybePromise<void>, onError: (error: Error) => void) {
  try {
    await v()
  } catch (e) {
    onError(e as Error)
  }
}

function wrapInfinity<T extends keyof TFD>(
  player: Player,
  forms: FormsListeners<T>,
  final: VoidFunction,
  onError: (error: Error) => void,
) {
  try {
    const f = forms[0]
    if (!f) return onError(new Error('Undefined form at index 0'))
    const ff = forms.slice(1)
    return TEST_onFormOpen(player, f[0], f[1], ff.length ? () => wrapInfinity(player, ff, final, onError) : final)
  } catch (e) {
    onError(e as Error)
  }
}
