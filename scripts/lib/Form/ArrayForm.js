import { Player } from '@minecraft/server'
import { ModalForm, stringSimilarity } from 'lib.js'
import { settingsGroupMenu } from 'modules/Commands/settings.js'
import { SETTINGS_GROUP_NAME, createSettingsObject, isDropdown } from '../Settings.js'
import { ActionForm } from './ActionForm.js'

/**
 * @template T
 * @template {import('lib.js').SettingsConfig} Filters
 * @template {import('lib.js').ParsedSettingsConfig<Filters>} ParsedFilters
 */
export class ArrayForm {
  /**
   * @param {string} title Can contain $page
   * @param {string} description
   * @param {T[]} array
   * @param {object} options
   * @param {Narrow<Filters>} options.filters
   * @param {(item: NoInfer<T>, filters: NoInfer<ParsedFilters>, form: ActionForm) => Parameters<ActionForm['addButton']> | false} options.button
   * @param {(array: NoInfer<T>[], filters: NoInfer<ParsedFilters>) => NoInfer<T>[]} [options.sort]
   * @param {(form: ActionForm) => void} [options.addCustomButtonBeforeArray]
   * @param {number} [options.itemsPerPage]
   * @param {VoidFunction} [options.back]
   */
  constructor(title, description, array, options) {
    /** @private */
    this.title = title
    /** @private */
    this.description = description

    /** @private */
    this.array = array
    /** @private */
    this.options = options

    /**
     * @type {Filters}
     * @private
     */
    // @ts-expect-error huh
    this.filtersConfig = { [SETTINGS_GROUP_NAME]: 'Фильтры', ...options.filters }
  }

  /**
   *
   * @param {Player} player
   * @param {number} [fromPage=1]
   * @param {JSONLike} [filtersDatabase]
   * @param {ParsedFilters} [filters]
   */
  show(
    player,
    fromPage = 1,
    filtersDatabase = {},
    // @ts-expect-error Huh
    filters = createSettingsObject(filtersDatabase, 'filters', this.options.filters),
    searchQuery = ''
  ) {
    const args = [filtersDatabase, filters]
    const page = paginate(this.getSorted(filters, searchQuery), this.options.itemsPerPage, fromPage)
    const form = this.createForm(fromPage, page)

    this.addFilterButton(form, filters, player, filtersDatabase, () => this.show(player, fromPage, ...args))
    this.addSearchButton(form, searchQuery, player, fromPage, filtersDatabase, filters)

    this.options.addCustomButtonBeforeArray?.(form)

    if (page.canGoBack) form.addButton('§l§b< §r§3Предыдущая', () => this.show(player, fromPage - 1, ...args))
    this.addButtons(page, form, filters)
    if (page.canGoNext) form.addButton('§3Следующая §l§b>', () => this.show(player, fromPage + 1, ...args))

    return form.show(player)
  }

  /**
   * @typedef {ReturnType<typeof paginate<T>>} Page
   */

  /**
   * @private
   * @param {number} fromPage
   * @param {Page} page
   */
  createForm(fromPage, page) {
    const form = new ActionForm(
      this.title.replace('$page', fromPage.toString()).replace('$max', page.maxPages.toString()),
      this.description
    )
    if (this.options.back) form.addButtonBack(this.options.back)

    return form
  }

  /**
   * @private
   * @param {ActionForm} form
   * @param {string} searchQuery
   * @param {Player} player
   * @param {number} fromPage
   * @param {JSONLike} filtersDatabase
   * @param {ParsedFilters} parsedFilters
   */
  addSearchButton(form, searchQuery, player, fromPage, filtersDatabase, parsedFilters) {
    form.addButton(
      !searchQuery ? '§3Поиск' : `§3Результаты поиска по запросу\n§f${searchQuery}`,
      'textures/ui/magnifying_glass',
      () => {
        new ModalForm('Поиск').addTextField('Запрос', 'Ничего не произойдет').show(player, (ctx, query) => {
          this.show(player, fromPage, filtersDatabase, parsedFilters, query)
        })
      }
    )
  }

  /**
   * @private
   * @param {ActionForm} form
   * @param {ParsedFilters} filters
   * @param {Player} player
   * @param {JSONLike} database
   * @param {VoidFunction} back
   */
  addFilterButton(form, filters, player, database, back) {
    const keys = Object.keys(this.filtersConfig)
    const size = keys.length

    const key = keys[0]
    const firstFilterConfig = this.filtersConfig[key]

    if (size === 0) return
    if (size === 1 && isDropdown(firstFilterConfig?.value)) {
      const values = firstFilterConfig.value
      let i = values.findIndex(e => filters[key] === e[0])
      form.addButton('§3' + firstFilterConfig.name + ':§f ' + values[i][1], () => {
        if (i >= values.length - 1) i = 0
        else i++

        // @ts-expect-error Huh
        filters[key] = values[i][0]

        back()
      })
    } else {
      const applied = Object.keys(database).length
      form.addButton(`§3Фильтры ${applied ? `§f(${applied})` : ''}`, 'textures/ui/gear', () =>
        settingsGroupMenu(player, 'filters', false, {}, database, { filters: this.filtersConfig }, back, false)
      )
    }
  }

  /**
   * @private
   * @param {ParsedFilters} filters
   */
  getSorted(filters, searchQuery = '') {
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

  /**
   * @private
   * @param {Page} page
   * @param {ActionForm} form
   * @param {ParsedFilters} filters
   */
  addButtons(page, form, filters) {
    for (const item of page.array) {
      const button = this.options.button(item, filters, form)

      if (button) form.addButton(...button)
    }
  }
}

/**
 *
 * @template T
 * @param {T[]} array
 * @param {number} [onPage]
 * @param {number} [startPage]
 */
function paginate(array, onPage = 10, startPage) {
  const maxPages = Math.ceil(array.length / onPage)
  const page = Math.min(Math.max(startPage || 1, 1), maxPages)

  return {
    array: /** @type {T[]} */ array.slice(page * onPage - onPage, page * onPage),
    maxPages,
    page,
    canGoNext: page < maxPages,
    canGoBack: page > 1,
  }
}
