import { Player } from '@minecraft/server'

// eslint-disable-next-line @typescript-eslint/naming-convention
export function TEST_createPlayer() {
  // @ts-expect-error Yes. We can do this
  return new Player() as Player
}
