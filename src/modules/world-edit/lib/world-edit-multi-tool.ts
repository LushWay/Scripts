import { ContainerSlot, ItemStack, Player } from '@minecraft/server'
import { ArrayForm, BUTTON, ModalForm, prompt } from 'lib'
import { t } from 'lib/text'
import { WorldEditTool } from './world-edit-tool'

interface ToolsDataStorage {
  /** Version */
  version: number

  /** Tools */
  tools: ToolData[]

  spread?: number
}

interface ToolData {
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

export abstract class WorldEditMultiTool extends WorldEditTool<ToolsDataStorage> {
  abstract tools: WorldEditTool[]

  override editToolForm(slot: ContainerSlot, player: Player) {
    this.editMultiToolsForm(slot, player, { sortMode: SortMode.Up })
  }

  storageSchema: ToolsDataStorage = {
    version: 1,
    tools: [],
  }

  protected editMultiToolsForm(slot: ContainerSlot, player: Player, options: { sortMode: SortMode }) {
    const tools = this.getToolsData(slot)

    new ArrayForm('MultiToolForm', tools)
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
          this.selectToolForm(slot, player, tools, back)
        })

        if (filters.mode === 'sort') {
          form.addButton(t`§l§dРежим сортировки: ${options.sortMode === SortMode.Up ? '/\\' : '\\/'}`, () => {
            options.sortMode = options.sortMode === SortMode.Up ? SortMode.Down : SortMode.Up
            back()
          })
        }

        form.addButton(t`§l§dНастройки`, () => this.settingsForm(slot, player, back))
      })
      .button((item, filters, _, back) => {
        const tool = this.getToolByData(item)
        const onClick = () => {
          if (filters.mode === 'delete') {
            prompt(player, t.error`Удалить инструмент ${item.name} безвозвратно?`, '§cУдалить', () => {
              const newTools = tools.filter(e => e !== item)
              this.saveToolsData(slot, newTools)
              this.updateItemSlot(slot, newTools)
            })
          } else if (filters.mode === 'edit') {
            if (tool) this.editOneToolForm(slot, player, tools, item, tool, back)
          } else {
            const index = tools.indexOf(item)
            const move = options.sortMode
            const to = index - move
            const max = tools.length - 1
            if (to < 0 || to > max) return back()
            ;[tools[to], tools[index]] = [tools[index], tools[to]]
            this.saveToolsData(slot, tools)
            back()
          }
        }

        if (!tool) return [`UNKNOWN\n${item.tpid}`, onClick]

        return [item.name, onClick]
      })
      .show(player)
  }

  protected updateItemSlot(slot: ContainerSlot, toolsData: ToolData[]) {
    slot.nameTag = t`§r§l${this.name} (${toolsData.length})`
    slot.setLore([' ', ...toolsData.map(e => e.name)])
  }

  private selectToolForm(slot: ContainerSlot, player: Player, toolsData: ToolData[], back: VoidFunction) {
    new ArrayForm('Тип инструмента', this.tools)
      .back(back)
      .button(tool => {
        return [
          tool.name,
          () => {
            const toolData: ToolData = { name: `T#: ${tool.name}`, tpid: tool.id }
            toolsData.push(toolData)
            this.editOneToolForm(slot, player, toolsData, toolData, tool, () =>
              this.selectToolForm(slot, player, toolsData, back),
            )
          },
        ]
      })
      .show(player)
  }

  protected settingsForm(slot: ContainerSlot, player: Player, back: VoidFunction) {
    const storage = this.getStorage(slot)
    new ModalForm('Настройки')
      .addSlider('Радиус рандомного распределения инструментов, 0 чтобы выключить', 0, 20, 1, storage.spread)
      .show(player, (_, spread) => {
        if (spread === 0) delete storage.spread
        else storage.spread = spread

        this.saveStorage(slot, storage, false)
        back()
      })
  }

  getToolByData(toolData: ToolData) {
    return this.tools.find(e => e.id === toolData.tpid)
  }

  protected editOneToolForm(
    slot: ContainerSlot,
    player: Player,
    toolsData: ToolData[],
    toolData: ToolData,
    tool: WorldEditTool,
    back: VoidFunction,
  ) {
    const proxiedTool = this.proxyTool(tool, toolData)
    if (!proxiedTool.editToolForm) return player.fail('Инструмент неизменяем')

    const onBack = () => (back(), this.updateItemSlot(slot, toolsData))
    proxiedTool.editToolForm(this.proxySlot(slot, toolsData, toolData, onBack), player)
  }

  forEachTool<T extends ContainerSlot | ItemStack>(
    slot: T,
    callback: (proxiedSlot: T, proxiedTool: WorldEditTool) => void,
  ) {
    const toolsData = this.getToolsData(slot)
    for (const item of toolsData) {
      const itemTool = this.getToolByData(item)
      if (!itemTool) continue

      const proxiedTool = this.proxyTool(itemTool, item)
      const proxiedSlot = this.proxySlot(slot, toolsData, item)

      callback(proxiedSlot, proxiedTool)
    }
  }

  proxySlot<T extends ContainerSlot | ItemStack>(
    slot: T,
    toolsData: ToolData[],
    toolData: ToolData,
    back?: VoidFunction,
  ): T {
    return {
      get nameTag() {
        return toolData.name
      },
      set nameTag(name) {
        toolData.name = name
      },
      setLore: () => {
        // Set lore always happens last, so save all data
        if (slot instanceof ContainerSlot) this.saveToolsData(slot, toolsData)
        back?.()
      },
      getLore() {
        return []
      },
    } satisfies Partial<ContainerSlot> as unknown as T
  }

  proxyTool(tool: WorldEditTool, toolSettings: ToolData) {
    return Object.setPrototypeOf(
      {
        getStorage(_, returnUndefined) {
          if (toolSettings.d) {
            return toolSettings.d
          } else {
            if (returnUndefined) return undefined
            return JSON.parse(JSON.stringify(this.storageSchema)) as object
          }
        },
        saveStorage(_, storage: object) {
          toolSettings.d = storage
        },
      } satisfies Partial<WorldEditTool>,
      tool,
    ) as typeof tool
  }

  getToolsData(slot: ContainerSlot | ItemStack): ToolData[] {
    return this.getStorage(slot, true)?.tools ?? []
  }

  saveToolsData(slot: ContainerSlot, toolData: ToolData[]) {
    this.saveStorage(slot, { ...this.getStorage(slot), tools: toolData }, false)
  }
}
