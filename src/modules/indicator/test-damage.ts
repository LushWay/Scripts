/* i18n-ignore */

import { EnchantmentType, EquipmentSlot, ItemStack, Player } from '@minecraft/server'
import { registerAsync } from '@minecraft/server-gametest'
import { MinecraftEnchantmentTypes, MinecraftItemTypes } from '@minecraft/vanilla-data'
import { Enchantments, isKeyof, Temporary } from 'lib'
import { ActionbarPriority } from 'lib/extensions/on-screen-display'
import { noI18n } from 'lib/i18n/text'
import { TestStructures } from 'test/constants'

const players: Player[] = []
registerAsync('test', 'damage', async test => {
  const player = test.spawnSimulatedPlayer({ x: 0, y: 1, z: 0 })
  players.push(player)
  armorCommand()

  new Temporary(({ world }) => {
    world.afterEvents.entityDie.subscribe(event => {
      if (event.deadEntity.id === player.id) {
        player.respawn()
      }
    })

    world.afterEvents.playerSpawn.subscribe(event => {
      if (event.player.id === player.id) {
        player.runCommand('tp @s @p[rm=1,c=1]')
      }
    })

    world.afterEvents.entityHurt.subscribe(event => {
      if (event.hurtEntity.id === player.id) {
        if (event.damageSource.damagingEntity instanceof Player) {
          const hp = event.hurtEntity.getComponent('health')?.currentValue ?? 0
          event.damageSource.damagingEntity.onScreenDisplay.setActionBar(
            noI18n`Damage: ${event.damage.toFixed(2)}, HP: ${hp.toFixed(2)}`,
            ActionbarPriority.High,
          )
        }
      }
    })

    world.beforeEvents.playerInteractWithEntity.subscribe(event => {
      if (event.target.id === player.id) {
      }
    })
  })

  await test.idle(1000)
})
  .maxTicks(999999)
  .structureName(TestStructures.empty)

let exists = false
function armorCommand() {
  if (exists) return

  exists = true
  new Command('simarmor')
    .setDescription('Заменяет броню у всех симулированных игроков созданных с помощью test:damage')
    .setPermissions('techAdmin')
    .array('type', ['Golden', 'Leather', 'Chainmail', 'Iron', 'Diamond', 'Netherite'])
    .int('level', true)
    .string('ench', true)
    .executes((ctx, type, level = 0, ench = MinecraftEnchantmentTypes.Protection) => {
      if (!isKeyof(ench, Enchantments.typed)) return ctx.error('Enchs:\n' + Object.keys(Enchantments.typed).join('\n'))
      const levels = Enchantments.typed[ench]

      const types: [EquipmentSlot, keyof typeof MinecraftItemTypes][] = [
        [EquipmentSlot.Head, `${type}Helmet`],
        [EquipmentSlot.Chest, `${type}Chestplate`],
        [EquipmentSlot.Legs, `${type}Leggings`],
        [EquipmentSlot.Feet, `${type}Boots`],
      ]
      let items: [EquipmentSlot, ItemStack | undefined][] = []

      const enchs = levels[level]
      if (!enchs) {
        if (level <= 4 && level >= 0) {
          items = types.map(([slot, typeId]) => {
            const item = new ItemStack(MinecraftItemTypes[typeId])

            if (level) {
              const { enchantable } = item
              if (!enchantable) return [slot, item]

              enchantable.addEnchantment({ type: new EnchantmentType(ench), level })
            }
            return [slot, item]
          })
        } else return ctx.error('Levels:\n' + Object.keys(ench).concat(['0', '1', '2', '3', '4']).join('\n'))
      } else {
        items = types.map(([slot, typeId]) => [slot, enchs[MinecraftItemTypes[typeId]]])
      }

      for (const player of players) {
        if (!player.isValid) continue

        const equippable = player.getComponent('equippable')
        if (!equippable) continue

        for (const [slot, item] of items) {
          if (typeof item === 'undefined') return ctx.error(`No item for slot ${slot}!`)
          equippable.setEquipment(slot, item)
        }
      }
    })
}
