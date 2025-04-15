/* eslint-disable */

import { RawMessage } from '@minecraft/server'
import * as GameTest from '@minecraft/server-gametest'
import { expand } from 'lib/extensions/extend'
import { stringifyError } from 'lib/util'
import { inspect, stringify } from 'lib/utils/inspect'
import { TestStructures } from 'test/constants'
import './framework'

declare module '@minecraft/server-gametest' {
  interface ExtendedTest extends Test {
    /** Spawns player at the test relative 0 0 0. Alias to {@link GameTest.Test.spawnSimulatedPlayer} */
    player(): ExtendedSimulatedPlayer
  }

  type ExtendedSimulatedPlayer = SimulatedPlayer
}

function formatRawText(e: RawMessage | string) {
  return typeof e === 'string' ? e : stringify(e)
}

let classNameGlobal = ''

export function gamesuite(className: string, callback: VoidFunction) {
  classNameGlobal = className
  callback()
  classNameGlobal = ''
}

export function gametest(should: string, testFunction: (test: GameTest.ExtendedTest) => Promise<void>) {
  if (!classNameGlobal) throw new Error('You can call it() only inside of the top-level describe() callback!')

  const className = classNameGlobal
  const fullname = className + ':' + should
  const filename = stringifyError.stack.get(1).split('\n')[0]?.trim() ?? 'unknown file'
  return GameTest.registerAsync(className, should, async test => {
    const history: string[] = []
    try {
      const Etest = expandTest(test, history, fullname)
      await testFunction(Etest)
      console.log(`§f§l§G PASS §r ${filename} > §f${fullname}`)
      try {
        // Etest.succeed()
      } catch {}
    } catch (error: any) {
      let info = `§f§l§R FAIL §r ${filename} > §f${fullname}\n`

      const stringHistory = history
        .concat(stringifyError(error))
        .map(e => e.split('\n'))
        .flat()
        .map(line => '§r§f\n  ' + line)
        .join('')
      info += `${stringHistory}\n  ` // \n §r§l§Y OUTPUT §r
      console.log(info)
      test.print(`§c§lFAIL§r §f${fullname}\n` + stringHistory)

      test.fail(stringifyError(error).replaceAll('§f', '§7'))
    }
  })
    .structureName(TestStructures.empty)
    .tag(GameTest.Tags.suiteDebug)
}

function expandTest(test: GameTest.Test, history: string[], fullname: string) {
  expand(test as GameTest.ExtendedTest, {
    player() {
      return this.spawnSimulatedPlayer({ x: 0, y: 0, z: 0 })
    },

    spawnSimulatedPlayer(location, name, gameMode) {
      const player = super.spawnSimulatedPlayer(location, name, gameMode)
      expandPlayer(player, this)

      return player
    },

    print(text) {
      history.push(text)

      // return super.print(`§ы§7§l${fullname ?? 'unknown test'}§8>§r §f${text}`)
    },
  })

  return test as GameTest.ExtendedTest
}

function expandPlayer(player: GameTest.SimulatedPlayer, test: GameTest.ExtendedTest) {
  expand(player, {
    get name() {
      return this.isValid ? super.name : 'Testing player'
    },
    playSound(sound, options) {
      test.print(`${this.name}: §9playSound§f(§2'${sound}'§f, ${inspect(options)}§f)`)
    },

    tell(message) {
      this.sendMessage(message)
    },

    sendMessage(message) {
      let string = ''
      if (Array.isArray(message)) {
        string = message.map(formatRawText).join('')
      } else {
        string = formatRawText(message)
      }

      test.print(`${this.name}: ${string}`)
    },
  })
}
