import { CommandContext } from 'lib/Command/Context.js'

const success = 'success'
/** @param {CommandContext} ctx */
const addsSuccessTag = ctx => ctx.player.addTag(success)

const command = new Command('cmd').setPermissions('everybody').executes(addsSuccessTag)

describe('lib.command', () => {
  it('inputs', async test => {
    const player = test.spawnSimulatedPlayer({ x: 0, y: 0, z: 0 })

    player.chat('.cmd')
    await test.idle(10)

    test.assert(player.hasTag(success), 'executing the command failed')
    test.succeed()
  })

  it('overloads', async test => {
    const player = test.player()

    command.overload('overload').executes(addsSuccessTag)
    player.chat('.cmd overloadf')
    await test.idle(10)

    test.assert(player.hasTag(success), 'executing the command failed')
    test.succeed()
  })

  it('alias', async test => {
    const player = test.player()

    command.setAliases('alias1', 'alias2')
    player.chat('.alias1')
    await test.idle(10)

    test.print('Test print')

    test.assert(player.hasTag(success), 'executing the command failed')
    test.succeed()
  })

  it('permission', async test => {
    const player = test.player()

    new Command('cmdw').setPermissions(() => false).executes(addsSuccessTag)
    player.chat('.cmdw')
    await test.idle(10)

    test.assert(!player.hasTag(success), 'executing the command failed')
    test.succeed()
  })
})
