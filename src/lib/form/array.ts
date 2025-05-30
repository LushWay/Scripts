import { Player } from '@minecraft/server'
import { MemoryTable } from 'lib/database/abstract'
import {
  SETTINGS_GROUP_NAME,
  Settings,
  settingsGroupMenu,
  type SettingsConfig,
  type SettingsConfigParsed,
  type SettingsDatabase,
} from 'lib/settings'
import { MaybeRawText } from 'lib/text'
import { rawTextToString } from 'lib/utils/lang'
import { stringSimilarity } from '../search'
import { util } from '../util'
import { ActionForm } from './action'
import { ModalForm } from './modal'
import { NewFormCallback } from './new'
import { BUTTON } from './utils'

export declare namespace ArrayForm {
  type Button<T, F> = (
    item: T,
    filters: F,
    form: ActionForm,
    back: VoidFunction,
  ) => readonly [text: MaybeRawText, callback: NewFormCallback] | false
  type Sort<T, F> = (array: T[], filters: F) => T[]
  type AddCustomButtons<TH, C> = (this: TH, form: ActionForm, filters: C, back: VoidFunction) => void

  interface Config<T, C extends SettingsConfig, F extends SettingsConfigParsed<C> = SettingsConfigParsed<C>> {
    filters: C
    description?: MaybeRawText
    button?: Button<T, F>
    sort?: Sort<T, F>
    addCustomButtonBeforeArray?: AddCustomButtons<this, F>
    itemsPerPage?: number
    minItemsForFilters?: number
    back?: NewFormCallback
  }
}

export class ArrayForm<
  const T,
  C extends SettingsConfig = SettingsConfig,
  F extends SettingsConfigParsed<C> = SettingsConfigParsed<C>,
> {
  private config: ArrayForm.Config<T, C, F> = { filters: { [SETTINGS_GROUP_NAME]: 'Пустые фильтры' } as C }

  constructor(
    private title: Text,
    private array: readonly T[],
  ) {}

  description(text?: MaybeRawText) {
    this.config.description = text
    return this
  }

  button(button: ArrayForm.Button<T, F>) {
    this.config.button = button
    return this
  }

  filters<const V extends SettingsConfig>(filters: V) {
    this.config.filters = { [SETTINGS_GROUP_NAME]: 'Фильтры', ...(filters as unknown as C) }
    return this as unknown as ArrayForm<T, V>
  }

  sort(sort: ArrayForm.Sort<T, F>) {
    this.config.sort = sort
    return this
  }

  addCustomButtonBeforeArray(callback: ArrayForm.AddCustomButtons<ArrayForm.Config<T, C, F>, F>) {
    this.config.addCustomButtonBeforeArray = callback
    return this
  }

  back(back?: NewFormCallback) {
    this.config.back = back
    return this
  }

  configure(config: Omit<ArrayForm.Config<T, C, F>, keyof this>) {
    Object.assign(this.config, config)
    return this
  }

  show(
    player: Player,
    fromPage = 1,
    filtersDatabase = new MemoryTable() as SettingsDatabase,
    filters = Settings.parseConfig(filtersDatabase, 'filters', this.config.filters) as F,
    searchQuery = '',
  ) {
    const args = [filtersDatabase, filters, searchQuery] as const
    const selfback = () => this.show(player, fromPage, ...args)
    const paginator = util.paginate(
      this.getSorted(player, filters, searchQuery, selfback),
      this.config.itemsPerPage,
      fromPage,
      this.config.minItemsForFilters,
    )

    const form = this.createForm(fromPage, paginator.maxPages)

    // Force show helper buttons when array is filtered
    // this is needed because when filters are applied and button count
    // is less then min items for filtes there is no way to
    // disable filters
    const isFiltered = paginator.array.length !== this.array.length
    const moreThenOnePage = paginator.maxPages !== 1

    if (isFiltered || moreThenOnePage) {
      this.addFilterButton(form, filters, player, filtersDatabase, selfback)
      this.addSearchButton(form, searchQuery, player, fromPage, filtersDatabase, filters)
    } else if (this.config.minItemsForFilters === 1) {
      this.addFilterButton(form, filters, player, filtersDatabase, selfback)
    }

    this.config.addCustomButtonBeforeArray?.(form, filters, selfback)

    // Array item buttons & navigation
    if (paginator.canGoBack)
      form.addButton('§r§3Предыдущая', BUTTON['<'], () => this.show(player, fromPage - 1, ...args))

    this.addButtons(paginator.array, form, filters, selfback)

    if (paginator.canGoNext) form.addButton('§3Следующая', BUTTON['>'], () => this.show(player, fromPage + 1, ...args))

    return form.show(player)
  }

  private createForm(fromPage: number, maxPages: number) {
    const form = new ActionForm(
      this.title.replace('$page', fromPage.toString()).replace('$max', maxPages.toString()),
      this.config.description,
    )
    if (this.config.back) form.addButtonBack(this.config.back)

    return form
  }

  private addSearchButton(
    form: ActionForm,
    searchQuery: string,
    player: Player,
    fromPage: number,
    filtersDatabase: SettingsDatabase,
    parsedFilters: F,
  ) {
    form.addButton(!searchQuery ? '§3Поиск' : `§3Результаты поиска по запросу\n§f${searchQuery}`, BUTTON.search, () => {
      new ModalForm('Поиск').addTextField('Запрос', 'Ничего не произойдет').show(player, (ctx, query) => {
        this.show(player, fromPage, filtersDatabase, parsedFilters, query)
      })
    })
  }

  private addFilterButton(
    form: ActionForm,
    filters: F,
    player: Player,
    database: SettingsDatabase,
    back: VoidFunction,
  ) {
    const keys = Object.keys(this.config.filters)
    const size = keys.length

    const key = keys[0]
    if (!key) return

    const firstFilterConfig = this.config.filters[key]
    if (!firstFilterConfig) return

    if (size === 0) return
    if (size === 1 && Settings.isDropdown(firstFilterConfig.value)) {
      const values = firstFilterConfig.value
      let i = values.findIndex(e => filters[key] === e[0])
      form.addButton(`§3${firstFilterConfig.name}:§f ${values[i]?.[1]}`, () => {
        if (i >= values.length - 1) i = 0
        else i++

        // @ts-expect-error AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
        filters[key] = values[i][0]

        back()
      })
    } else {
      const propertyName = 'filters'
      const applied = Object.keys(database.get(propertyName) ?? {}).length
      form.addButton(`§3Фильтры ${applied ? `§f(${applied})` : ''}`, BUTTON.settings, () =>
        settingsGroupMenu(
          player,
          propertyName,
          false,
          {},
          database,
          { [propertyName]: this.config.filters },
          back,
          false,
        ),
      )
    }
  }

  private getSorted(player: Player, filters: F, searchQuery = '', back: VoidFunction) {
    if (!this.config.button) throw new TypeError('No button modifier!')
    if (searchQuery) {
      // Search query overrides sort option
      const sorted = []
      const empty = new ActionForm('', '')
      for (const item of this.array) {
        const button = this.config.button(item, filters, empty, back)

        if (button) {
          const buttonText = typeof button[0] === 'string' ? button[0] : rawTextToString(button[0], player.lang)
          sorted.push({ button, search: stringSimilarity(searchQuery, buttonText), item })
        }
      }

      return sorted.sort((a, b) => b.search - a.search).map(e => e.item)
    } else if (this.config.sort) {
      return this.config.sort(this.array.slice(), filters)
    } else return this.array
  }

  private addButtons(array: readonly T[], form: ActionForm, filters: F, back: VoidFunction) {
    if (!this.config.button) throw new TypeError('No button modifier!')
    for (const item of array) {
      const button = this.config.button(item, filters, form, back)

      if (button) form.addButton(...button)
    }
  }
}
