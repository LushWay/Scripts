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

declare global {
  /**
   * Script api testing framework
   *
   * @param should
   * @param testFunction
   */
  function it(should: string, testFunction: (test: gametest.Test) => Promise<void>): void
  /**
   * Script api testing framework
   *
   * @param className
   * @param callback
   */
  function describe(className: string, callback: VoidFunction): void
}

export {}
