import { util } from 'lib.js'
import { WorldEdit } from '../../lib/WorldEdit.js'

/** @type {('none' | 'x' | 'xz' | 'z')[]} */
const rotTypes = ['none', 'x', 'xz', 'z']

new Command({
  name: 'paste',
  description: 'Вставляет заранее скопированную зону',
  role: 'builder',
  type: 'we',
})
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

    const we = WorldEdit.forPlayer(ctx.sender)
    we.paste(ctx.sender, rotation, mirror, entities, blocks, integrity, seed)
  })
