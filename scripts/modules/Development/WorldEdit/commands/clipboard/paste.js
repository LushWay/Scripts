import { WorldEditBuild } from '../../builders/WorldEditBuilder.js'

new XCommand({
  name: 'paste',
  description: 'Вставляет заранее скопированную зону',
  role: 'moderator',
  type: 'we',
})
  .int('rotation', true)
  .string('mirror', true)
  .boolean('includeEntites', true)
  .boolean('includeBlocks', true)
  .int('integrity', true)
  .int('seed', true)
  .executes(
    (ctx, rotation, mirror, includeEntites, includeBlocks, integrity, seed) => {
      let blocks, entities
      if (!includeEntites && !includeBlocks) {
        entities = false
        blocks = true
      } else {
        blocks = includeBlocks
        entities = includeEntites
      }
      if (![0, 90, 180, 270].includes(rotation))
        return ctx.error('Неправильный градус: §f' + rotation)

      ctx.reply(
        WorldEditBuild.paste(
          ctx.sender,
          // @ts-expect-error
          rotation,
          mirror,
          entities,
          blocks,
          integrity,
          seed
        )
      )
    }
  )
