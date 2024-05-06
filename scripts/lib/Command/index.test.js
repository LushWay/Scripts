import { register } from '@minecraft/server-gametest'

const success = "success"

new Command('cmd')
  .setDescription('Test command')
  .setAliases('alias', 'alias2')
  .overload('hp')
  .executes((ctx) => {
    ctx.player.addTag(success)
  })

register(Command.name, 'input', test => {
  const player = test.spawnSimulatedPlayer({ x: 0, y: 0, z: 0 }, 'CommandTest')

  player.chat('-cmd hp')
  test.assert(player.hasTag(success), "executing the command failed")
})
