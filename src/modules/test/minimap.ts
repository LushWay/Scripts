import { RGBA, system, world } from '@minecraft/server'
import { MinecraftBlockTypes } from '@minecraft/vanilla-data'
import { removeNamespace } from 'lib'

system.afterEvents.scriptEventReceive.subscribe(
  ({ id }) => {
    if (id !== 'minimap:gen') return

    const block = world.overworld.getBlock({ x: 0, y: 0, z: 0 })
    const bricks = Object.entries(MinecraftBlockTypes).filter(e => {
      const name = e[0].toLowerCase()
      return (
        name.includes('brick') ||
        name.includes('slab') ||
        name.includes('sign') ||
        name.includes('banner') ||
        name.includes('gate') ||
        name.includes('furnace') ||
        name.includes('dripleaf') ||
        name.includes('fence')
      )
    })

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
      MinecraftBlockTypes.Chest,
      MinecraftBlockTypes.BrewingStand,
      MinecraftBlockTypes.EndRod,
      MinecraftBlockTypes.Barrel,
      MinecraftBlockTypes.Grindstone,
      MinecraftBlockTypes.SeaPickle,
      MinecraftBlockTypes.Lantern,
      MinecraftBlockTypes.SoulLantern,
      MinecraftBlockTypes.MelonBlock,
      MinecraftBlockTypes.FlowerPot,
      MinecraftBlockTypes.WitherSkeletonSkull,
      MinecraftBlockTypes.OxeyeDaisy,
      MinecraftBlockTypes.FenceGate,
      MinecraftBlockTypes.HoneyBlock,
      MinecraftBlockTypes.Beehive,
      MinecraftBlockTypes.Smoker,
      MinecraftBlockTypes.LitSmoker,
      MinecraftBlockTypes.FletchingTable,
      MinecraftBlockTypes.ShortDryGrass,
      MinecraftBlockTypes.TallDryGrass,
      ...bricks.map(e => e[1]),
    ]

    const customColors: Record<string, string> = {
      ...Object.fromEntries(
        Object.entries(MinecraftBlockTypes)
          .filter(e => e[1].includes('button'))
          .map(e => [e[1] as string, 'rgba(0, 0, 0, 200)']),
      ),
      [MinecraftBlockTypes.StructureVoid]: 'rgba(0, 0, 0, 255)',
      [MinecraftBlockTypes.Barrier]: 'rgba(0, 0, 0, 255)',
      [MinecraftBlockTypes.CommandBlock]: 'rgba(0, 0, 0, 255)',
      [MinecraftBlockTypes.StructureBlock]: 'rgba(0, 0, 0, 255)',
      [MinecraftBlockTypes.Frame]: 'rgba(0, 0, 0, 255)',
      [MinecraftBlockTypes.IronBars]: 'rgba(0, 0, 0, 255)',
      [MinecraftBlockTypes.FlowerPot]: 'rgba(0, 0, 0, 255)',
      [MinecraftBlockTypes.WitherSkeletonSkull]: 'rgba(0, 0, 0, 255)',
      [MinecraftBlockTypes.EndRod]: 'rgba(0, 0, 0, 255)',
    }

    const colorModifiers: Record<string, { lighten?: number; darken?: number } | undefined> = {
      ...Object.fromEntries(
        bricks.map(e => [
          e[1] as string,
          e[1].includes('slab') &&
          !(e[1].includes('andesite') || (e[1].includes('stone') && !e[1].includes('sand')) || e[1].includes('brick'))
            ? { lighten: 0 }
            : { lighten: 30 },
        ]),
      ),
      [MinecraftBlockTypes.Andesite]: { lighten: 70 },
      [MinecraftBlockTypes.Cobblestone]: { lighten: 60 },
      [MinecraftBlockTypes.Stone]: { lighten: 50 },
      [MinecraftBlockTypes.Diorite]: { darken: 80 },
    }

    let output = ''
    for (const type of types) {
      if (!block) break
      block.setType(type)
      let color = block.getMapColor()
      const modifier = colorModifiers[type]
      if (modifier) {
        color = Object.map(color as unknown as Record<string, number>, (k, v) => [
          k,
          modifier.lighten
            ? (v = v * ((100 + modifier.lighten) / 100))
            : modifier.darken
              ? (v = v * (modifier.darken / 100))
              : v,
        ]) as unknown as RGBA
      }
      const mapColor = customColors[type] ?? `rgb(${c(color.red)}, ${c(color.green)}, ${c(color.blue)})`
      const t = removeNamespace(type)

      output += `**${t}* = ${mapColor}\n`
    }

    for (const a of Object.entries(customColors)) {
      output += `${a[0]} = ${a[1]}\n`
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
