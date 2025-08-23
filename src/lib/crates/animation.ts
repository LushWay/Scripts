import { Entity, ItemStack, Player, ShortcutDimensions, TicksPerSecond, system, world } from '@minecraft/server'
import { MinecraftEffectTypes, MinecraftEntityTypes } from '@minecraft/vanilla-data'
import { StructureRootId } from 'lib/assets/structures'
import { Cooldown } from '../cooldown'
import { i18n } from '../i18n/text'
import { Vec } from '../vector'

export default class ChestLootAnimation {
  constructor(
    private id: string,
    private dimensionId: ShortcutDimensions = 'overworld',
  ) {}

  private timesec = 2

  private timetick = TicksPerSecond * this.timesec

  private timems = this.timesec * 1000

  private readonly entityOffset = { x: 1.2, y: -1, z: 0.9 }

  private animate(entity: Entity, player: Player, current: CurrentAnimation) {
    const standing = current.stage > 25
    const y = standing ? 0 : current.stage * 0.005
    const animationLocation = Vec.add(entity.location, { x: 0, y, z: 0 })
    entity.teleport(animationLocation)
    const particleSource = !standing ? animationLocation : Vec.add(entity.location, { x: 0, y: 1.5, z: 0 })

    player.spawnParticle(
      'minecraft:balloon_gas_particle',
      Vec.subtract(Vec.add(particleSource, { x: 0.5, y: -0.2, z: 0.5 }), this.entityOffset),
    )
  }

  private current: CurrentAnimation | undefined

  start(player: Player, item: ItemStack, location: Vector3) {
    if (this.current) this.stop()

    world.structureManager.place(StructureRootId.FloatingItem, world[this.dimensionId], location, {
      includeBlocks: false,
    })

    const entity = world[this.dimensionId].getEntities({
      type: MinecraftEntityTypes.ArmorStand,
      location,
      maxDistance: 1,
    })[0]

    if (typeof entity === 'undefined') {
      console.warn(i18n.error`Unable to spawn armor stand for ${this.id}, location ${Vec.string(location, true)}`)
      return
    }

    // Equippable does not work's with armor stand in 1.20.81, please replace to equippable replace when fixed
    entity.runCommand(`replaceitem entity @s slot.weapon.mainhand 0 ${item.typeId}`)
    const enchantments = item.enchantable?.getEnchantments()
    if (enchantments?.length) entity.runCommand(`enchant @s ${enchantments[0]?.type.id} 1`)

    entity.addEffect(MinecraftEffectTypes.SlowFalling, this.timetick, { showParticles: false, amplifier: 255 })
    entity.teleport(Vec.add(location, this.entityOffset))

    this.current = {
      item,
      entity,
      player,
      timeout: 0,
      stage: 0,
      date: Date.now(),
    }

    this.onFrame()
  }

  private onFrame() {
    if (!this.current) return

    this.current.timeout = system.runTimeout(
      () => {
        if (!this.current) {
          this.stop()
          return
        }
        if (!this.current.entity.isValid || !this.current.player.isValid) {
          this.stop()
          return
        }
        if (Cooldown.isExpired(this.current.date, this.timems)) {
          this.stop()
          return
        }

        this.animate(this.current.entity, this.current.player, this.current)
        this.current.stage++
        this.onFrame()
      },
      'chest animation',
      1,
    )
  }

  stop() {
    if (!this.current) return

    system.clearRun(this.current.timeout)
    if (this.current.entity.isValid) this.current.entity.remove()
    if (this.current.player.isValid) {
      this.current.player.container?.addItem(this.current.item)
      this.current.player.info(i18n`Вы получили свою награду!`)
    }

    delete this.current
  }
}

interface CurrentAnimation {
  entity: Entity
  player: Player
  item: ItemStack
  timeout: number
  stage: number
  date: number
}
