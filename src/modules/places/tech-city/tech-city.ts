import { MinecraftEntityTypes } from '@minecraft/vanilla-data'
import { Boss, Loot, ms } from 'lib'
import { BaseItem } from '../base/base'
import { City } from '../lib/city'
import { Stoner } from '../lib/npc/stoner'
import { CannonBulletItem, CannonItem } from 'modules/features/cannon'
import { Engineer, MicroSchema } from './engineer'

class TechCityBuilder extends City {
  constructor() {
    super('TechCity', 'Техноград')
    this.create()
  }

  engineer = new Engineer(this.group)

  private create() {
    const { normal, donut } = this.createKits(
      new Loot()
        .itemStack(CannonItem.blueprint)
        .chance('10%')

        .itemStack(CannonBulletItem.blueprint)
        .chance('10%')

        .item('RedTerracotta')
        .amount({
          '20...40': '70%',
          '41...64': '30%',
        })
        .chance('10%').build,

      new Loot()
        .itemStack(CannonBulletItem.blueprint)
        .chance('3%')

        .itemStack(CannonBulletItem.itemStack)
        .chance('3%')

        .itemStack(CannonItem.blueprint)
        .chance('2%')

        .itemStack(CannonItem.itemStack)
        .chance('2%')

        .itemStack(BaseItem.blueprint)
        .chance('1%')

        .itemStack(BaseItem.itemStack)
        .chance('1%').build,
    )

    new Command('techcity').setPermissions('techAdmin').executes(ctx => {
      ctx.player.container?.addItem(normal.createKeyItemStack())
      ctx.player.container?.addItem(donut.createKeyItemStack())
    })
  }

  golemn = Boss.create()
    .group(this.group)
    .id('golem')
    .name('Робот')
    .typeId(MinecraftEntityTypes.IronGolem)
    .loot(
      new Loot('GolemLoot')
        .itemStack(MicroSchema)
        .amount({ '10...64': '1%' })
        .chance('20%')
        .item('RedTerracotta')
        .amount({ '0...120': '10%', '121...300': '20%' }).build,
    )
    .respawnTime(ms.from('min', 10))
    .spawnEvent(true)

  stoner = new Stoner(this.group)
}

export const TechCity = new TechCityBuilder()
