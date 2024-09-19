/* eslint-disable @typescript-eslint/naming-convention */

import { Player } from '@minecraft/server'
import type { FormCl, FormData } from 'test/__mocks__/minecraft_server-ui'

export function TEST_createPlayer() {
  // @ts-expect-error Yes. We can do this
  return new Player() as Player
}

export interface TestPlayer extends Player {
  onForm?: { [K in keyof FormData]?: FormCl<K> }
}

export function TEST_onFormOpen<T extends keyof FormData>(player: Player, kind: T, callback: FormCl<T>) {
  ;(player as TestPlayer).onForm ??= {}
  // @ts-expect-error Huhuhhuhuh
  ;(player as TestPlayer).onForm[kind] = callback
}
