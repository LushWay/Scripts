import { system, world } from '@minecraft/server'
import { MinecraftBlockTypes } from '@minecraft/vanilla-data'
import { removeNamespace } from 'lib'

system.afterEvents.scriptEventReceive.subscribe(
  ({ id }) => {
    if (id !== 'minimap') return

    const block = world.overworld.getBlock({ x: 0, y: 0, z: 0 })
    const types = [
      MinecraftBlockTypes.Andesite,
      MinecraftBlockTypes.Blackstone,
      MinecraftBlockTypes.Cobblestone,
      MinecraftBlockTypes.Stone,
      MinecraftBlockTypes.DarkPrismarine,
      MinecraftBlockTypes.Deepslate,
      MinecraftBlockTypes.Diorite,
      MinecraftBlockTypes.EndStone,
      MinecraftBlockTypes.Prismarine,
      MinecraftBlockTypes.PurpurBlock,
      MinecraftBlockTypes.RedSandstone,
      MinecraftBlockTypes.Stone,
      MinecraftBlockTypes.BrickBlock,
      MinecraftBlockTypes.Campfire,
      MinecraftBlockTypes.Scaffolding,
      MinecraftBlockTypes.Tuff,
      MinecraftBlockTypes.Granite,
      MinecraftBlockTypes.RedSand,
      MinecraftBlockTypes.Mud,
    ]
    const customNames: Record<string, string> = {
      [MinecraftBlockTypes.BrickBlock]: '**brick*',
    }

    const customColors: Record<string, string> = {
      [MinecraftBlockTypes.Andesite]: 'rgb(196, 196, 196)',
    }

    let output = ''
    for (const type of types) {
      if (!block) break
      block.setType(type)
      const color = block.getMapColor()
      const mapColor = customColors[type] ?? `rgb(${c(color.red)}, ${c(color.green)}, ${c(color.blue)})`
      const t = customNames[type] ?? removeNamespace(type)

      output += `**${t}* = ${mapColor}\n`
    }

    function c(color: number | undefined) {
      if (typeof color === 'undefined') return 0
      return ~~(color * 255)
    }

    console.log(output)
    console.log(
      'Now copy the output above to the <unmined>/config/custom.blockstyles.txt and restart unmined to see the results.',
    )
  },
  { namespaces: ['minimap'] },
)
