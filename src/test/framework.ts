/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck GOO AWAY

import { RawMessage } from '@minecraft/server'
import * as gametest from '@minecraft/server-gametest'
import { expand } from 'lib/extensions/extend'
import { util } from 'lib/util'
import { TestStructures } from 'test/constants'
import './framework'

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

expand(gametest.SimulatedPlayer.prototype, {
  get name() {
    return this.isValid() ? super.name : 'Testing player'
  },
  _test: null,
  get test() {
    if (!this._test)
      throw new ReferenceError(
        'Simulated player has no _test property, make sure that it is spawned using player() or spawnSimulatedPlayer() method!',
      )

    return this._test
  },
  set test(test) {
    this._test = test
  },

  playSound(sound, options) {
    this.test.print(`playSound('${sound}', ${util.inspect(options)})`)
  },

  tell(message) {
    return this.sendMessage(message)
  },

  sendMessage(message) {
    let string = ''
    if (Array.isArray(message)) {
      string = message.map(formatRawText).join('')
    } else {
      string = formatRawText(message)
    }

    this.test.print(string)
  },
})

function formatRawText(e: RawMessage | string) {
  return typeof e === 'string' ? e : util.error.isError(e) ? util.error(e) : util.inspect(e)
}

expand(gametest.Test.prototype, {
  player() {
    return this.spawnSimulatedPlayer({ x: 0, y: 0, z: 0 })
  },

  spawnSimulatedPlayer(location, name, gameMode) {
    const player = super.spawnSimulatedPlayer(location, name, gameMode)

    player.test = this

    return player
  },

  _history: [],

  print(text) {
    this._history.push(text)

    return super.print(this.fullname ? this.fullname + text : 'testname > ' + text)
  },
})

let classNameGlobal = ''

export function suite(className: string, callback: VoidFunction) {
  classNameGlobal = className
  callback()
  classNameGlobal = ''
}

export function test(should: string, testFunction: (test: gametest.Test) => Promise<void>) {
  if (!classNameGlobal) throw new Error('You can call it() only inside of the top-level describe() callback!')

  const className = classNameGlobal
  const fullname = className + ':' + should
  return gametest
    .registerAsync(className, should, async test => {
      expand(test, { _history: [], fullname })

      try {
        await testFunction(test)
      } catch (error) {
        let info = `\n§f§l§X FAILED §r §f§l${fullname}\n`

        const history = test._history
          .concat(util.error(error))
          .map(e => e.split('\n'))
          .flat()
          .map(line => '§r§f\n  ' + line)
          .join('')

        info += `${history}\n  ` // \n §r§l§Y OUTPUT §r
        console.log(info)
      }
    })
    .structureName(TestStructures.empty)
    .tag(gametest.Tags.suiteDebug)
}
