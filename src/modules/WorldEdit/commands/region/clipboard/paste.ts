import { util } from 'lib'
import { WorldEdit } from '../../../lib/WorldEdit'

const rotTypes = ['none', 'x', 'xz', 'z'] as const

new Command('paste')
  .setDescription('Вставляет заранее скопированную зону')
  .setPermissions('builder')
  .setGroup('we')
  .int('rotation', true)
  .array('mirror', rotTypes, true)
  .boolean('includeEntites', true)
  .boolean('includeBlocks', true)
  .int('integrity', true)
  .string('seed', true)
  .executes((ctx, rotation, mirror, includeEntites, includeBlocks, integrity, seed) => {
    if (isNaN(rotation)) rotation = 0
    let blocks, entities
    if (!includeEntites && !includeBlocks) {
      entities = false
      blocks = true
    } else {
      blocks = includeBlocks
      entities = includeEntites
    }
    if (!util.isKeyof(rotation, { 0: 0, 90: 90, 180: 180, 270: 270 }))
      return ctx.error('Неправильный градус: §f' + rotation)

    const we = WorldEdit.forPlayer(ctx.player)
    we.paste(ctx.player, rotation, mirror, entities, blocks, integrity, seed)
  })
