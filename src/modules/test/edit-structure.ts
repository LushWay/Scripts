import { BlockVolume, LocationInUnloadedChunkError, world } from '@minecraft/server'
import { MinecraftBlockTypes } from '@minecraft/vanilla-data'
import { Region, Vec } from 'lib'
import { StructureDungeonsId } from 'lib/assets/structures'
import { form } from 'lib/form/new'
import { noI18n } from 'lib/i18n/text'

const f = form((f, { player }) => {
  for (const [name, id] of Object.entries(StructureDungeonsId)) {
    let details = noI18n.error`Не удалось найти структуру`
    const structure = world.structureManager.get(id)
    if (structure) {
      details = Vec.string(structure.size, true)
    }

    f.button(`${name}\n${details}`, () => {
      if (!structure) return player.fail('Не удалось найти структуру')

      const box = new BlockVolume(
        Vec.floor(player.location),
        Vec.add(player.location, structure.size).add(Vec.up).floor(),
      )
      const dimension = player.dimension

      try {
        for (const location of dimension
          .getBlocks(box, { excludeTypes: [MinecraftBlockTypes.Air] })
          .getBlockLocationIterator()) {
          player.fail(
            noI18n.error`Блок на ${location} (${dimension.getBlock(location)?.typeId}) не является воздухом. Невозможно установить структуру`,
          )
          return
        }
      } catch (e) {
        if (e instanceof LocationInUnloadedChunkError) return player.fail(noI18n.error`Область не прогружена: ${e}`)
        throw e
      }

      const structureBlock = dimension.getBlock(Vec.floor(player.location))
      if (!structureBlock) return player.fail(noI18n.error`Не работает`)

      structureBlock.setType(MinecraftBlockTypes.StructureBlock)

      const start = Vec.floor(player.location).add(Vec.up)
      for (const vector of Vec.forEach(start, Vec.add(start, structure.size).substract(Vec.one))) {
        dimension.setBlockType(vector, MinecraftBlockTypes.StructureVoid)
      }

      world.structureManager.place(structure, dimension, start)

      player.success(
        'Установлено. Как закончите редактировать, сохраните вручную и удалите топориком пушто майн не дает автоматизировать это :(',
      )
    })
  }
})

new Command('edit-structure')
  .setDescription('Редактирует структуру для дальнейшего сохранения. Полезно для настройки лута данжей')
  .setPermissions('techAdmin')
  .executes(ctx => {
    const region = Region.getAt(ctx.player)
    if (region)
      return ctx.player.fail(
        noI18n.error`Невозможно установить структуру в регионе ${region.displayName ?? region.name}, найдите место без региона и других построек`,
      )

    f.command(ctx)
  })
