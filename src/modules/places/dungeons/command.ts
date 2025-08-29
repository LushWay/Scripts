/* i18n-ignore */

import { MolangVariableMap, Player, StructureRotation, system, world } from '@minecraft/server'
import { ArrayForm, isKeyof, Vec } from 'lib'
import { Items } from 'lib/assets/custom-items'
import { StructureDungeonsId } from 'lib/assets/structures'
import { ItemLoreSchema } from 'lib/database/item-stack'
import { ActionbarPriority } from 'lib/extensions/on-screen-display'
import { i18n, noI18n } from 'lib/i18n/text'
import { SphereArea } from 'lib/region/areas/sphere'
import { DungeonRegion } from 'modules/places/dungeons/dungeon'
import { CustomDungeonRegion } from './custom-dungeon'
import { Dungeon } from './loot'

const toolSchema = new ItemLoreSchema('dungeonCreationTool', Items.WeTool)
  .property('type', String)
  .display('Тип данжа', t => Dungeon.names[t] ?? t)
  .nameTag((_, s) => i18n`§7Создает данж ${getDungeonName(s.type)}`)
  .lore('§7Используй, чтобы создать данж')
  .build()

function getDungeonName(type: string) {
  return isKeyof(type, Dungeon.names)
    ? Dungeon.names[type]
    : isKeyof(type, Dungeon.customNames)
      ? Dungeon.customNames[type]
      : type
}

const dungeons = [...Object.values(StructureDungeonsId), ...Object.keys(Dungeon.customNames)]

new Command('dungeon').setPermissions('techAdmin').executes(ctx => {
  const hand = ctx.player.mainhand()
  if (hand.hasItem() && !toolSchema.is(hand)) {
    return ctx.error('Предмет в руке будет перезаписан')
  }

  new ArrayForm('Выбери тип данжа', dungeons)
    .button(structureId => {
      return [
        structureId in Dungeon.customNames
          ? noI18n`(Без структуры) ${Dungeon.customNames[structureId]}`
          : (Dungeon.names[structureId] ?? structureId),
        () => {
          const hand = ctx.player.mainhand()
          if (toolSchema.is(hand)) {
            const schema = toolSchema.parse(ctx.player.lang, hand)
            if (schema) schema.type = structureId
            else ctx.error('Создайте новый предмет, старый сломался')
          } else {
            hand.setItem(toolSchema.create(ctx.player.lang, { type: structureId }).item)
          }
        },
      ]
    })
    .show(ctx.player)
})

function getStructureRotation(player: Player) {
  const p = player.getRotation().y
  if (p > 45 && p <= 135) return StructureRotation.Rotate90
  if ((p > 135 && p <= 180) || (p < -135 && p >= -180)) return StructureRotation.Rotate180
  if (p > -135 && p <= -90) return StructureRotation.Rotate270
  return StructureRotation.None
}

function getDungeon(player: Player, rotation: StructureRotation) {
  const mainhand = player.mainhand()
  const storage = toolSchema.parse(player.lang, mainhand)
  if (!storage) return

  const region = isKeyof(storage.type, Dungeon.names)
    ? new DungeonRegion(
        new SphereArea({ center: Vec.floor(player.location), radius: 0 }, player.dimension.type),
        { structureId: storage.type, rotation },
        '',
      )
    : new CustomDungeonRegion(
        new SphereArea({ center: Vec.floor(player.location), radius: 10 }, player.dimension.type),
        { name: storage.type },
        '',
      )

  if (!region.configureSize()) {
    player.onScreenDisplay.setActionBar(noI18n.error`Неизвестный данж: ${storage.type}`)
    return
  }
  return region
}

world.afterEvents.itemUse.subscribe(event => {
  const player = event.source
  const rotation = getStructureRotation(player)
  const dungeon = getDungeon(player, rotation)
  if (!dungeon) return

  if (dungeon instanceof CustomDungeonRegion) {
    CustomDungeonRegion.create(dungeon.area, { name: dungeon.ldb.name })
  } else {
    DungeonRegion.create(dungeon.area, { structureId: dungeon.structureId, rotation })
  }

  player.success(noI18n`Данж создан на ${Vec.string(dungeon.area.center, true)}`)
})

system.runPlayerInterval(
  player => {
    const rotation = getStructureRotation(player)
    const dungeon = getDungeon(player, rotation)
    if (!dungeon) return

    const { from, to } = dungeon.structureBounds()
    for (const l of Vec.forEach(from, to)) {
      if (!Vec.isEdge(from, to, l)) continue

      player.spawnParticle('minecraft:balloon_gas_particle', l, particle)
    }

    player.onScreenDisplay.setActionBar(
      noI18n`rotation: ${rotation} size: ${Vec.subtract(from, to)}\nfrom: ${from} to: ${to}`,
      ActionbarPriority.High,
    )
  },
  'dungeon place',
  15,
)

const particle = new MolangVariableMap()

particle.setVector3('direction', {
  x: 0,
  y: 0,
  z: 0,
})
