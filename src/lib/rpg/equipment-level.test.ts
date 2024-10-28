import { EquipmentSlot, ItemStack } from '@minecraft/server'
import { MinecraftItemTypes } from '@minecraft/vanilla-data'
import { TEST_createPlayer } from 'test/utils'
import { EquippmentLevel } from './equipment-level'

describe('equipment-level', () => {
  it('should get equipment level of items', () => {
    const player = TEST_createPlayer()
    player.container?.addItem(new ItemStack(MinecraftItemTypes.DiamondSword))

    expect(EquippmentLevel.getItemsLevel(player)).toBe(EquippmentLevel.ItemsLevel.Diamond)
  })

  it('should get equipment level of armor', () => {
    const player = TEST_createPlayer()
    const eq = player.getComponent('equippable')

    if (!eq) throw new Error('SKSl')
    eq.setEquipment(EquipmentSlot.Chest, new ItemStack(MinecraftItemTypes.DiamondChestplate))

    expect(EquippmentLevel.getArmorLevel(player)).toBe(EquippmentLevel.ItemsLevel.Diamond)
  })
})
