import { WorldEdit } from '../../lib/world-edit'

new Command('desel')
  .setGroup('we')
  .setAliases('deselect', 'delselect', 'delsel')
  .setDescription('Выключает отрисовку текущего выделения')
  .setPermissions('builder')
  .executes(ctx => {
    const we = WorldEdit.forPlayer(ctx.player)
    we.pos1 = { x: 0, z: 0, y: 0 }
    we.pos2 = { x: 0, z: 0, y: 0 }
    ctx.reply(`§3► §fОчищено.`)
  })
