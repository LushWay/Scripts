import { CommandContext } from 'lib/command/context'
import { suite, test } from 'test/framework'
import './index'

const success = 'success'
const addsSuccessTag = (ctx: CommandContext) => ctx.player.addTag(success)

const command = new Command('cmd').setPermissions('everybody').executes(addsSuccessTag)

suite('lib.command', () => {
  test('inputs', async test => {
    const player = test.spawnSimulatedPlayer({ x: 0, y: 0, z: 0 })

    player.chat('.cmd')
    test.succeedWhen(() => test.assert(player.hasTag(success), 'command was not executed'))
  })

  test('overloads', async test => {
    const player = test.player()

    command.overload('overload').executes(addsSuccessTag)
    player.chat('.cmd overload')
    test.succeedWhen(() => test.assert(player.hasTag(success), 'command was not executed'))
  })

  test('alias', async test => {
    const player = test.player()

    command.setAliases('alias1', 'alias2')
    player.chat('.alias1')
    test.succeedWhen(() => test.assert(player.hasTag(success), 'command was not executed'))
  })

  test('permission', async test => {
    const player = test.player()

    new Command('cmdw').setPermissions(() => false).executes(addsSuccessTag)
    player.chat('.cmdw')
    test.succeedWhen(() => test.assert(!player.hasTag(success), 'command was executed even with wrong permissions'))
  })
})
