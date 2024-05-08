import { world } from '@minecraft/server'
import { SimulatedPlayer, Tags, Test, registerAsync } from '@minecraft/server-gametest'
import { extend } from 'lib/Extensions/extend.js'
import { util } from 'lib/util.js'
import { TestStructures } from 'test/constants.js'

extend(SimulatedPlayer.prototype, {
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

/**
 * @param {import('@minecraft/server').RawText | string} e
 * @returns
 */
function formatRawText(e) {
  return typeof e === 'string' ? e : util.error.isError(e) ? util.error(e, { parseOnly: true }) : util.inspect(e)
}

extend(Test.prototype, {
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

    return super.print(text)
  },
})

let classNameGlobal = ''

/**
 * @param {string} className
 * @param {VoidFunction} callback
 */
function describe(className, callback) {
  classNameGlobal = className
  callback()
  classNameGlobal = ''
}

/**
 * @param {string} should
 * @param {(test: Test) => Promise<void>} testFunction
 */
function it(should, testFunction) {
  if (!classNameGlobal) throw new Error('You can call it() only inside of the top-level describe() callback!')

  const className = classNameGlobal
  const fullname = className + ':' + should
  registerAsync(className, should, async test => {
    extend(test, { _history: [] })

    try {
      await testFunction(test)
    } catch (error) {
      let info = `\n§f§l§X FAILED §r §f§l${fullname}\n`

      const history = test._history
        .concat(util.error(error, { parseOnly: true }))
        .map(e => e.split('\n'))
        .flat()
        .map(line => '§r§f\n  ' + line)
        .join('')

      info += `${history}\n  ` // \n §r§l§Y OUTPUT §r

      console.log(info)
    }
  })
    .structureName(TestStructures.empty)
    .tag(Tags.suiteDebug)
}

world.afterEvents

globalThis.it = it
globalThis.describe = describe
