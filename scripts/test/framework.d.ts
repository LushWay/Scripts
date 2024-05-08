import * as gametest from '@minecraft/server-gametest'

declare module '@minecraft/server-gametest' {
  interface Test {
    /** Spawns player at the test relative 0 0 0. Alias to {@link gametest.Test.spawnSimulatedPlayer} */
    player(): SimulatedPlayer
    _history: string[]
  }

  interface SimulatedPlayer {
    /** The test that simulated player attached to */
    test: Test
    _test: null | Test
  }
}
