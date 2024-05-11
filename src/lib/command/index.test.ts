import { CommandContext } from 'lib/command/context'
import { suite, test } from '../../test/framework'

const success = 'success'
const addsSuccessTag = (ctx: CommandContext) => ctx.player.addTag(success)

const command = new Command('cmd').setPermissions('everybody').executes(addsSuccessTag)

suite('lib.command', () => {
  test('inputs', async test => {
    const player = test.spawnSimulatedPlayer({ x: 0, y: 0, z: 0 })

    player.chat('.cmd')
    await test.idle(10)

    test.assert(player.hasTag(success), 'executing the command failed')
    test.succeed()
  })

  test('overloads', async test => {
    const player = test.player()

    command.overload('overload').executes(addsSuccessTag)
    player.chat('.cmd overloadf')
    await test.idle(10)

    test.assert(player.hasTag(success), 'executing the command failed')
    test.succeed()
  })

  test('alias', async test => {
    const player = test.player()

    command.setAliases('alias1', 'alias2')
    player.chat('.alias1')
    await test.idle(10)

    test.print('Test print')

    test.assert(player.hasTag(success), 'executing the command failed')
    test.succeed()
  })

  test('permission', async test => {
    const player = test.player()

    new Command('cmdw').setPermissions(() => false).executes(addsSuccessTag)
    player.chat('.cmdw')
    await test.idle(10)

    test.assert(!player.hasTag(success), 'executing the command failed')
    test.succeed()
  })
})
