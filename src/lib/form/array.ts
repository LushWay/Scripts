import { Player } from '@minecraft/server'
import { SETTINGS_GROUP_NAME, Settings, SettingsDatabase, settingsGroupMenu } from 'lib/settings'
import { stringSimilarity } from '../search'
import { util } from '../util'
import { ActionForm } from './action'
import { ModalForm } from './modal'
import { BUTTON } from './utils'

export class ArrayForm<
  T,
  Filters extends import('lib.js').SettingsConfig,
  ParsedFilters extends import('lib.js').SettingsConfigParsed<Filters>,
> {
  private filtersConfig: Filters

  constructor(
    private title: string,
    private description: string,
    private array: T[],
    private options: {
      filters: Narrow<Filters>
      button: (
        item: NoInfer<T>,
        filters: NoInfer<ParsedFilters>,
        form: ActionForm,
      ) => Parameters<ActionForm['addButton']> | false
      sort?: (array: NoInfer<T>[], filters: NoInfer<ParsedFilters>) => NoInfer<T>[]
      addCustomButtonBeforeArray?: (form: ActionForm) => void
      itemsPerPage?: number
      minItemsForFilters?: number
      back?: VoidFunction
    },
  ) {
    this.filtersConfig = {
      [SETTINGS_GROUP_NAME]: 'Фильтры',
      ...(options.filters as Filters),
    }
  }

  show(
    player: Player,
    fromPage = 1,
    filtersDatabase: SettingsDatabase = {},
    filters: ParsedFilters = Settings.parseConfig(
      filtersDatabase,
      'filters',
      this.options.filters as Filters,
    ) as ParsedFilters,
    searchQuery = '',
  ) {
    const args = [filtersDatabase, filters] as const
    const paginator = util.paginate(
      this.getSorted(filters, searchQuery),
      this.options.itemsPerPage,
      fromPage,
      this.options.minItemsForFilters,
    )

    const form = this.createForm(fromPage, paginator.maxPages)

    // Force show helper buttons when array is filtered
    // this is needed because when filters are applied and button count
    // is less then min items for filtes there is no way to
    // disable filters
    if (paginator.array.length !== this.array.length || paginator.maxPages !== 1) {
      this.addFilterButton(form, filters, player, filtersDatabase, () => this.show(player, fromPage, ...args))
      this.addSearchButton(form, searchQuery, player, fromPage, filtersDatabase, filters)
    }

    this.options.addCustomButtonBeforeArray?.(form)

    // Array item buttons & navigation
    if (paginator.canGoBack)
      form.addButton('§r§3Предыдущая', BUTTON['<'], () => this.show(player, fromPage - 1, ...args))

    this.addButtons(paginator.array, form, filters)

    if (paginator.canGoNext) form.addButton('§3Следующая', BUTTON['>'], () => this.show(player, fromPage + 1, ...args))

    return form.show(player)
  }

  private createForm(fromPage: number, maxPages: number) {
    const form = new ActionForm(
      this.title.replace('$page', fromPage.toString()).replace('$max', maxPages.toString()),
      this.description,
    )
    if (this.options.back) form.addButtonBack(this.options.back)

    return form
  }

  private addSearchButton(
    form: ActionForm,
    searchQuery: string,
    player: Player,
    fromPage: number,
    filtersDatabase: SettingsDatabase,
    parsedFilters: ParsedFilters,
  ) {
    form.addButton(
      !searchQuery ? '§3Поиск' : `§3Результаты поиска по запросу\n§f${searchQuery}`,
      'textures/ui/magnifying_glass',
      () => {
        new ModalForm('Поиск').addTextField('Запрос', 'Ничего не произойдет').show(player, (ctx, query) => {
          this.show(player, fromPage, filtersDatabase, parsedFilters, query)
        })
      },
    )
  }

  private addFilterButton(
    form: ActionForm,
    filters: ParsedFilters,
    player: Player,
    database: SettingsDatabase,
    back: VoidFunction,
  ) {
    const keys = Object.keys(this.filtersConfig)
    const size = keys.length

    const key = keys[0]
    const firstFilterConfig = this.filtersConfig[key]

    if (size === 0) return
    if (size === 1 && Settings.isDropdown(firstFilterConfig?.value)) {
      const values = firstFilterConfig.value
      let i = values.findIndex(e => filters[key] === e[0])
      form.addButton('§3' + firstFilterConfig.name + ':§f ' + values[i][1], () => {
        if (i >= values.length - 1) i = 0
        else i++

        // @ts-expect-error AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
        filters[key] = values[i][0]

        back()
      })
    } else {
      const propertName = 'filters'
      const applied = Object.keys(database[propertName] ?? {}).length
      form.addButton(`§3Фильтры ${applied ? `§f(${applied})` : ''}`, 'textures/ui/gear', () =>
        settingsGroupMenu(player, propertName, false, {}, database, { [propertName]: this.filtersConfig }, back, false),
      )
    }
  }

  private getSorted(filters: ParsedFilters, searchQuery = '') {
    if (searchQuery) {
      // Search query overrides sort option
      const sorted = []
      const empty = new ActionForm('', '')
      for (const item of this.array) {
        const button = this.options.button(item, filters, empty)

        if (button) {
          sorted.push({ button, search: stringSimilarity(searchQuery, button[0]), item })
        }
      }

      return sorted.sort((a, b) => b.search - a.search).map(e => e.item)
    } else if (this.options.sort) {
      return this.options.sort(this.array.slice(), filters)
    } else return this.array
  }

  private addButtons(array: T[], form: ActionForm, filters: ParsedFilters) {
    for (const item of array) {
      const button = this.options.button(item, filters, form)

      if (button) form.addButton(...button)
    }
  }
}
