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

export function TEST_onFormOpen<T extends keyof TFD>(player: Player, kind: T, callback: TestFormCallback<T>) {
  const onForm = ((player as TestPlayer).onForm ??= {})
  // eslint-disable-next-line @typescript-eslint/non-nullable-type-assertion-style
  ;(onForm[kind] as TestFormCallback<T>) = callback
}
