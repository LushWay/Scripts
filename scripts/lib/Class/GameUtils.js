import { Block, BlockTypes, Entity, ItemStack, Player } from '@minecraft/server'
import { ActionFormData, ActionFormResponse } from '@minecraft/server-ui'
import { MinecraftBlockTypes } from '@minecraft/vanilla-data.js'
import { showForm } from '../Form/utils.js'
import { untyped_terrain_textures } from '../List/terrain-textures.js'
import { MODULE } from './OptionalModules.js'
import { inaccurateSearch } from './Search.js'

export const GAME_UTILS = {
  /**
   * @param {string} name
   * @returns {undefined | string}
   */
  env(name) {
    if (MODULE.ServerAdmin) {
      return MODULE.ServerAdmin.variables.get(name)
    }
  },
  /**
   *
   * @param {string} string
   */
  toNameTag(string) {
    // Format
    string = string.replace(/^minecraft:/, '').replace(/_(.)/g, ' $1')

    // Capitalize first letter
    string = string[0].toUpperCase() + string.slice(1)

    return string
  },
  /**
   *
   * @param {ItemStack} item
   */
  localizationName(item) {
    let id = item.typeId.replace('minecraft:', '')
    if (blocks.includes(item.typeId)) {
      for (const fn of blockModifiers) {
        const result = fn(id)
        id = result ?? id
      }

      return `%tile.${id}.name`
    }

    for (const fn of itemModifiers) {
      const result = fn(id)
      id = result ?? id
    }

    let name = `%item.${id}.name`
    for (const fn of afterItems) name = fn(name) ?? name

    return name
  },
  /**
   * @param {Player} player
   * @returns {Promise<Block | ItemStack | false>}
   */
  async selectBlock(player) {
    /** @type {Array<Block | ItemStack | 'buffer'>} */
    const blocks = []

    /**
     * @type {ActionFormData & { buffer?: ActionFormData["button"]; }}
     */
    const form = new ActionFormData()

    const nativeAddButton = form.button.bind(form)
    form.buffer = (text, iconPath) => {
      blocks.push('buffer')
      nativeAddButton(text, iconPath)
      return form
    }
    form.button = (text, iconPath) => {
      nativeAddButton(text, iconPath)
      return form
    }

    form.title('Выбери блок')
    const underfeat = player.location
    underfeat.y--
    const underfeatBlock = player.dimension.getBlock(underfeat)

    if (underfeatBlock && underfeatBlock.typeId !== 'minecraft:air') {
      const id = underfeatBlock.typeId.replace(/^minecraft:/, '')
      form.buffer('Блок под ногами')

      form.button(id, this.getBlockTexture(id))
      blocks.push(underfeatBlock)
    }

    form.buffer('Инвентарь')

    const inventory = player.getComponent('inventory').container
    for (let i = 0; i < inventory.size; i++) {
      const item = inventory.getItem(i)
      if (!item || !BlockTypes.get(item.typeId)) continue
      const id = item.typeId.replace(/^minecraft:/, '')
      form.button(id, this.getBlockTexture(id))
      blocks.push(item)
    }

    const result = await showForm(form, player)
    if (result === false || !(result instanceof ActionFormResponse) || !result.selection) return false

    const selectedBlock = blocks[result.selection]

    if (selectedBlock === 'buffer') return await this.selectBlock(player)
    return selectedBlock
  },
  /**
   * @param {string} id
   */
  getBlockTexture(id) {
    id = id.replace(/^minecraft:/, '')
    const search = inaccurateSearch(id, Object.keys(untyped_terrain_textures))
    const textures = untyped_terrain_textures[search[0][0]].textures

    return Array.isArray(textures) ? textures[0] : textures
  },
  /**
   * Sometimes some entity properties throws
   * @template {Entity | Player} S
   * @param {S} entity
   * @template {keyof S} K
   * @param {K} key
   * @returns {S[K] | undefined}
   */
  safeGet(entity, key) {
    try {
      return entity[key]
    } catch (e) {
      return undefined
    }
  },
}

/** @type {string[]} */
const blocks = Object.values(MinecraftBlockTypes)

const itemTypes = ['boat', 'banner_pattern']
const itemRegExp = new RegExp(`^(.+)_(${itemTypes.join('|')})`)

/** @type {((s: string) => string | undefined)[]} */
const itemModifiers = [
  spawnEgg => {
    const match = spawnEgg.match(/^(.+)_spawn_egg$/)
    if (!match) return
    return `spawn_egg.entity.${match[1]}`
  },
  chestBoat => {
    const match = chestBoat.match(/^(.+)_chest_boat$/)
    if (!match) return
    return `chest_boat.${match[1]}`
  },
  id => {
    if (id.includes('.')) return
    const match = id.match(itemRegExp)
    if (!match) return
    const [, color, type] = match
    return `${type}.${color}`
  },
  darkOak => {
    if (darkOak.includes('dark_oak') && darkOak !== 'dark_oak_door') return darkOak.replace('dark_oak', 'big_oak')
  },
]
/** @type {((s: string) => string)[]} */
const afterItems = [s => s.replace(/\.name$/, '')]

const blockTypes = ['wool']
const blockRegExp = new RegExp(`^(.+)_(${blockTypes.join('|')})`)

/** @type {((s: string) => string | undefined)[]} */
const blockModifiers = [
  id => {
    if (id === 'cobblestone_wall') return `cobblestone_wall.normal`
  },
  id => {
    if (id.includes('.')) return
    const match = id.match(blockRegExp)
    if (!match) return
    const [, color, type] = match
    return `${type}.${color}`
  },
]
