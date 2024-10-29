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

enum SortMode {
  Up = 1,
  Down = -1,
}

export abstract class WorldEditMultiTool extends WorldEditTool<{ version: number }> {
  loreFormat = {
    version: 1,
  }

  abstract tools: WorldEditTool<any>[]

  editToolForm = (slot: ContainerSlot, player: Player) => {
    this.editMultiToolsForm(slot, player, { sortMode: SortMode.Up })
  }

  protected editMultiToolsForm(slot: ContainerSlot, player: Player, options: { sortMode: SortMode }) {
    const storage = this.getStorage(slot)

    new ArrayForm('MultiToolForm', storage)
      .filters({
        mode: {
          name: '§l§dРежим',
          value: [
            ['edit', 'Редактировать'],
            ['delete', 'Удалить'],
            ['sort', 'Изменить порядок'],
          ],
        },
      })
      .configure({ minItemsForFilters: 1 })
      .addCustomButtonBeforeArray((form, filters, back) => {
        form.addButton('§l§dДобавить', BUTTON['+'], () => {
          this.selectToolForm(slot, player, storage, back)
        })

        if (filters.mode === 'sort') {
          form.addButton(t`§l§dРежим сортировки: ${options.sortMode === SortMode.Up ? '/\\' : '\\/'}`, () => {
            options.sortMode = options.sortMode === SortMode.Up ? SortMode.Down : SortMode.Up
            back()
          })
        }
      })
      .button((item, filters, _, back) => {
        const tool = this.getToolByItem(item)
        const onClick = () => {
          if (filters.mode === 'delete') {
            prompt(player, t.error`Удалить инструмент ${item.name} безвозвратно?`, '§cУдалить', () => {
              const newStorage = storage.filter(e => e !== item)
              this.writeStorage(slot, newStorage)
              this.updateItemSlot(slot, newStorage)
            })
          } else if (filters.mode === 'edit') {
            if (tool) this.editOneToolForm(slot, player, storage, item, tool, back)
          } else {
            const index = storage.indexOf(item)
            const move = options.sortMode
            const to = index - move
            const max = storage.length - 1
            if (to < 0 || to > max) return back()
            ;[storage[to], storage[index]] = [storage[index], storage[to]]
            this.writeStorage(slot, storage)
            back()
          }
        }

        if (!tool) return [`UNKNOWN\n${item.tpid}`, onClick]

        return [item.name, onClick]
      })
      .show(player)
  }

  protected updateItemSlot(slot: ContainerSlot, storage: StorageItem[]) {
    slot.nameTag = t`§r§l${this.name} (${storage.length})`
    slot.setLore([' ', ...storage.map(e => e.name)])
  }

  private selectToolForm(slot: ContainerSlot, player: Player, storage: StorageItem[], back: VoidFunction) {
    new ArrayForm('Тип инструмента', this.tools)
      .back(back)
      .button(tool => {
        return [
          tool.name,
          () => {
            const item: StorageItem = { name: `T#: ${tool.name}`, tpid: tool.id }
            storage.push(item)
            this.editOneToolForm(slot, player, storage, item, tool, () =>
              this.selectToolForm(slot, player, storage, back),
            )
          },
        ]
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
    back: VoidFunction,
  ) {
    const proxiedTool = this.proxyTool(tool, item)
    if (!proxiedTool.editToolForm) return player.fail('Инструмент неизменяем')

    const onBack = () => (back(), this.updateItemSlot(slot, storage))
    proxiedTool.editToolForm(this.proxySlot(slot, storage, item, onBack), player)
  }

  proxySlot(slot: ContainerSlot, storage: StorageItem[], item: StorageItem, back?: VoidFunction) {
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
        back?.()
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

        return parsed.i.filter(Boolean)
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
