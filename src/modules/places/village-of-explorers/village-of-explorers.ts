import { ItemStack, world } from '@minecraft/server'
import { MinecraftEntityTypes, MinecraftItemTypes } from '@minecraft/vanilla-data'
import { Boss, Loot, ms, Vector } from 'lib'
import { City } from '../lib/city'
import { Butcher } from '../lib/npc/butcher'
import { Stoner } from '../lib/npc/stoner'
import { Woodman } from '../lib/npc/woodman'
import { Mage } from './mage'
import { createBossSlime } from './slime.boss'

export const BossSlimeBall = new ItemStack(MinecraftItemTypes.SlimeBall).setInfo(
  '§aМагическая слизь',
  'Используется у Инженера',
)

class VillageOfExporersBuilder extends City {
  constructor() {
    super('VillageOfExporers', 'Деревня исследователей')
    this.create()
  }

  butcher = new Butcher(this.group)

  woodman = new Woodman(this.group)

  slimeBoss = createBossSlime(this.group)

  mage = new Mage(this.group)

  private create() {
    this.createKits(new Loot().item('Dirt').build, new Loot().itemStack(BossSlimeBall).build)
  }

  stoner = new Stoner(this.group)
}

export const VillageOfExplorers = new VillageOfExporersBuilder()
