import { ContainerSlot, Player } from '@minecraft/server'
import { ArrayForm, BUTTON, prompt } from 'lib'
import { t } from 'lib/text'
import { WorldEditTool } from './world-edit-tool'

// This one tool saved data to the item properties because of the limit of the lore
// TODO Use dynamicProperties to save data on other tools and items and use tableFormat for lore

const propertyId = 'we_multi_tool'

interface StorageFormat {
  /** Version */
  v: number
  /** Items */
  i: StorageItem[]
}

interface StorageItem {
  /** Tool type id */
  tpid: string

  /** Tool item name tag */
  name: string

  /** Tool data */
  d?: object
}

export abstract class WorldEditMultiTool extends WorldEditTool<{ version: number }> {
  loreFormat = {
    version: 1,
  }

  abstract tools: WorldEditTool<any>[]

  editToolForm = (slot: ContainerSlot, player: Player) => {
    this.editMultiToolsForm(slot, player)
  }

  protected editMultiToolsForm(slot: ContainerSlot, player: Player) {
    const storage = this.getStorage(slot)

    new ArrayForm('MultiToolForm', storage)
      .filters({
        mode: {
          name: 'Режим',
          value: [
            ['edit', 'Редактировать'],
            ['delete', 'Удалить'],
          ],
        },
      })
      .configure({ minItemsForFilters: 1 })
      .addCustomButtonBeforeArray(form => {
        form.addButton('Добавить', BUTTON['+'], () => {
          new ArrayForm('Тип инструмента', this.tools)
            .back(() => this.editMultiToolsForm(slot, player))
            .button(tool => {
              return [
                tool.name,
                () => {
                  const item: StorageItem = { name: `T#: ${tool.name}`, tpid: tool.id }
                  storage.unshift(item)
                  this.editOneToolForm(slot, player, storage, item, tool)
                },
              ]
            })
            .show(player)
        })
      })
      .button((item, filters) => {
        const tool = this.getToolByItem(item)
        const onClick = () => {
          if (filters.mode === 'delete') {
            prompt(player, t.error`Удалить инструмент ${item.name} безвозвратно?`, '§cУдалить', () => {
              this.writeStorage(
                slot,
                storage.filter(e => e !== item),
              )
            })
          } else {
            if (tool) this.editOneToolForm(slot, player, storage, item, tool)
          }
        }

        if (!tool) return [`UNKNOWN\n${item.tpid}`, onClick]

        return [item.name, onClick]
      })
      .show(player)
  }

  getToolByItem(item: StorageItem) {
    return this.tools.find(e => e.id === item.tpid)
  }

  protected editOneToolForm(
    slot: ContainerSlot,
    player: Player,
    storage: StorageItem[],
    item: StorageItem,
    tool: WorldEditTool<any>,
  ) {
    const proxiedTool = this.proxyTool(tool, item)
    if (!proxiedTool.editToolForm) return player.fail('Инструмент неизменяем')

    proxiedTool.editToolForm(this.proxySlot(slot, storage, item), player)
  }

  proxySlot(slot: ContainerSlot, storage: StorageItem[], item: StorageItem) {
    return {
      get nameTag() {
        return item.name
      },
      set nameTag(name) {
        item.name = name
      },
      setLore: () => {
        // Set lore always happens last, so save all data
        this.writeStorage(slot, storage)
      },
      getLore() {
        return []
      },
    } satisfies Partial<ContainerSlot> as unknown as ContainerSlot
  }

  proxyTool(tool: WorldEditTool<any>, item: StorageItem) {
    return Object.setPrototypeOf(
      {
        parseLore(_, returnUndefined) {
          if (item.d) {
            return item.d
          } else {
            if (returnUndefined) return
            return JSON.parse(JSON.stringify(this.loreFormat)) as object
          }
        },
        stringifyLore(format: object) {
          item.d = format
          return []
        },
      } satisfies Partial<WorldEditTool<any>>,
      tool,
    ) as typeof tool
  }

  getStorage(slot: ContainerSlot): StorageItem[] {
    const property = slot.getDynamicProperty(propertyId)
    if (typeof property === 'string') {
      try {
        const parsed = JSON.parse(property) as StorageFormat
        if (parsed.v !== this.loreFormat.version) return []

        return parsed.i
      } catch {}
    }

    return []
  }

  writeStorage(slot: ContainerSlot, storage: StorageItem[]) {
    slot.setDynamicProperty(
      propertyId,
      JSON.stringify({ v: this.loreFormat.version, i: storage } satisfies StorageFormat),
    )
  }
}
