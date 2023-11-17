import { Player, system, world } from '@minecraft/server'
import { StoredRequest } from 'lib/Class/StoredRequest.js'
import { DynamicPropertyDB } from 'lib/Database/Properties.js'
import { Sounds } from 'lib/List/used-sounds.js'
import { ActionForm, Cooldown, MessageForm, is, util } from 'xapi.js'
import { MENU } from '../../Server/Menu/var.js'
import { JOIN } from '../../Server/PlayerJoin/var.js'
import { CubeRegion, Region } from '../../Server/Region/Region.js'
import {
  clearRegion,
  createRegion,
  fillRegion,
  prompt,
  teleportToRegion,
} from './utils.js'

const Description = Symbol('description')
// RAID АНАРХИЯ
/** @type {Record<string, any>} */
const Themes = {
  'RAID АНАРХИЯ': {
    [Description]:
      'Анархия с добавлением различных механик, оружия, боссов и тд. Режим является отдельной вселенной и имеет персональный лор.',
    Деревни: {
      [Description]:
        'Бывшие племена, которые издавна соперничают друг с другом образовали поселения возле одной, богатой ресурсами, шахты. Являются самыми низкими по степени развития, так как используют только древние технологии. Деревни делятся на 2 типа:',
      Шахтеров: {
        [Description]:
          'Жители этой дерeвни живут в джунглях и добывают руды, но не умеют их обрабатывать',
        дома: 'Первобытные дома на деревьях, построенные на основе тропического дерева, терракоты и грязи',
        палатки:
          'Шерстянные палатки, построенные на земле в качестве перекантовочных пунктов для шахтеров',
        декорации:
          'Это могут быть подъемные краны, складированная руда, костры, растения, фонари и тд',
      },
      Исследователей: {
        [Description]:
          'Жители этой дерeвни живут на мангровых болотах и изучают руды, также не умеют их обрабатывать',
        дома: 'Первобытные дома на платформах, построенные над болотами на основе мангрового дерева, терракоты и грязи',
        декорации:
          'Это могут быть подъемные краны, исследовательские столы и приборы, растения, фонари и тд',
      },
    },
    Города: {
      [Description]:
        'после разрушительной войны между бывшими королевствами остались только руины, оставшиеся люди разделились на две группы и основали 2 города:',
      Каменоломня: {
        [Description]:
          'Первая группа решила основать город на руинах, где перерабатывают камень и руды, добытые в деревнях. Город основан около гор и является средним по степени развития.',
        дома: 'Дома в стиле средневековья, это также могут быть мельницы, амбары и другие постройки',
        башни: 'Башни, построенные из сланца на основе руин из булыжника',
        декорации:
          'Это могут быть всевозможные повозки, провизия, растения, фонари и тд',
      },
      Стальград: {
        [Description]:
          'Вторая группа решила уйти с раздробленных земель и искать новые земли. Месса, где они основали свой город, была богата кварцевыми залежами, который активно использовался в современных технологиях. Из кварца и обработанной руды можно было сделать мощнейшие оружия. Благодаря этому город стал лучшим по степени развития.',
        дома: 'Дома от 3 этажей в современном стиле, в основе которых лежит кварц',
        заводы: 'Заводы для производства оружия и других предметов из кварца',
        декорации: 'Это могут быть всевозможные вышки, растения, фонари и тд',
      },
    },
  },
}

// МИНИИГРЫ: { "BATLLE ROYAL": { "постройки для": "" } },

/**
 * @type {DynamicPropertyDB<string, {id?: string, theme?: string[], archiveOwners?: string[]}>}
 */
const PROPERTY = new DynamicPropertyDB('buildRegion', {
  defaultValue() {
    return {}
  },
})
export const DB = PROPERTY.proxy()

system.runPlayerInterval(
  player => {
    const currentRegion = CubeRegion.blockLocationInRegion(
      player.location,
      player.dimension.type
    )
    const inOwnRegion =
      currentRegion && currentRegion.permissions.owners[0] === player.id

    if (!inOwnRegion) return

    const data = DB[currentRegion.permissions.owners[0]]
    if (!data || !Array.isArray(data.theme)) {
      player.onScreenDisplay.setTitle('§cВыбери тему в меню!')
    }
  },
  'selectTheme',
  40
)

JOIN.EVENTS.playerClosedGuide.subscribe(player => {
  player.playSound(Sounds.levelup)
  player.tell('Приветствую на сервере')
  const oldRegion = DB[player.id]
  if (!oldRegion) createRegion(player)
})

MENU.OnOpen = player => {
  const regionID = DB[player.id]?.id
  const playerRegion = CubeRegion.regions.find(e => e.key === regionID)
  if (!playerRegion) {
    player.tell(
      '§b> §3У вас не было ни одной незаархивированной площадки, поэтому мы создали вам новую.'
    )
    createRegion(player)
    return false
  }

  const currentRegion = CubeRegion.blockLocationInRegion(
    player.location,
    player.dimension.type
  )
  const inOwnRegion =
    currentRegion && currentRegion.permissions.owners[0] === player.id
  const isRegionBuilder =
    currentRegion && currentRegion.permissions.owners.includes(player.id)

  let body = ''
  const add = (/** @type {string} */ t) => (body += `${t}\n`)
  add(
    `§3Координаты вашей площадки: §c${playerRegion.from.x} §b${playerRegion.from.z}\n `
  )

  /** @type {string | undefined} */
  let regionOwnerName

  if (currentRegion) {
    regionOwnerName = Player.name(currentRegion.permissions.owners[0])
    if (inOwnRegion) {
      add('§3Вы находитесь на §fсвоей§3 площадке')
    } else if (isRegionBuilder) {
      add('§3Вам разрешено строить на этой площадке.')
    } else {
      if (regionOwnerName) {
        add('§3Сейчас вы на площадке игрока §f' + regionOwnerName)
      } else {
        const rawArchive = DB['ARCHIVE:' + currentRegion.key].archiveOwners
        const archive = Array.isArray(rawArchive) ? rawArchive : []
        regionOwnerName = Player.name(archive[0])

        add('§eЭто площадка была заархивирована')
        add('§3Строители: §f' + archive.map(Player.name).join('§r§3, §f'))
      }
    }

    add('')

    const data = DB[currentRegion.permissions.owners[0]]
    if (data && Array.isArray(data.theme)) {
      const themeDescription = data.theme.reduce(
        (obj, key) => obj?.[key],
        Themes
      )
      if (themeDescription) {
        add(themeDescription)
      } else {
        add('§cВыбранная тема была удалена или переименована.')
        delete data.theme
      }
    } else add('§cТема не выбрана.')

    add('')
  }

  const menu = new ActionForm('Меню площадки', body)
  const backButton = '§l§b< §r§3Назад'

  /**
   * @param {ActionForm} form
   */
  function addBackButton(form) {
    form.addButton(backButton, () => menu.show(player))
    return form
  }

  menu.addButton('Площадки', () => {
    const form = new ActionForm(
      'Доступные площадки',
      '§3Здесь вы можете телепортироваться на любую площадку, где можете строить'
    )

    /**
     * @param {CubeRegion} region
     * @param {string} name
     */
    const toPlatform = (region, name) => {
      form.addButton(name, () => {
        teleportToRegion(player, region)
        player.tell('§b> §3Вы были перемещены на площадку §r' + name)
      })
    }
    toPlatform(playerRegion, '§aВаша площадка')
    for (const reg of CubeRegion.regions.filter(
      e =>
        e.permissions.owners.includes(player.id) && e.key !== playerRegion.key
    )) {
      toPlatform(reg, Player.name(reg.permissions.owners[0]) ?? 'NoName')
    }
    addBackButton(form)
    form.show(player)
  })

  if (currentRegion) {
    const editRequest = new StoredRequest(
      DB,
      'EDIT',
      currentRegion.permissions.owners[0]
    )

    if (inOwnRegion) {
      menu.addButton('Темы', () => {
        const pathDelimeter = ' §f> §3'
        /**
         *
         * @param {Record<string | symbol, any>} obj
         * @param {ActionForm} parentForm
         */
        function listButtons(obj, parentForm, path = '') {
          const description = obj[Description]
          const form = new ActionForm(
            path ? path : 'Темы',
            description ??
              '§3Тут можно просмотреть и выбрать темы для строительства'
          )

          // {theme: {subteme1: desc, subteme2: desc}}
          // {subteme1: desc, subteme2: desc}

          for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'symbol') continue
            if (typeof value === 'string') {
              // key - theme, value - description
              form.addButton(key, () => {
                new MessageForm('Выбор темы', value)
                  .setButton1('§aВыбрать тему', () => {
                    DB[player.id].theme = path
                      .split(pathDelimeter)
                      .concat([key])
                    player.tell(`Выбранная тема: ${path} ${key}`)
                  })
                  .setButton2(backButton, () => form.show(player))
                  .show(player)
              })
            } else {
              form.addButton(key, () => {
                listButtons(
                  value,
                  form,
                  `${path ? path + pathDelimeter : ''}${key}`
                )
              })
            }
          }

          form.addButton(backButton, () => parentForm.show(player))

          form.show(player)
        }

        listButtons(Themes, menu)
      })

      menu.addButton('Строители', () => {
        const form = new ActionForm(
          'Строители',
          '§3Тут можно просмотреть и удалить строителей вашего региона'
        )

        for (const id of currentRegion.permissions.owners.slice(1)) {
          let playerName = Player.name(id)
          if (!playerName) playerName = 'NoName'
          form.addButton(playerName, () => {
            prompt(
              player,
              '§cВы точно хотите удалить игрока §r' +
                playerName +
                '§r§c из строителей вашего региона?',
              'ДА',
              () => {
                currentRegion.permissions.owners =
                  currentRegion.permissions.owners.filter(e => e !== id)
                currentRegion.update()
                player.tell('§b> §3Успешно!')
                const requestedPlayer = Player.fetch(id)
                if (requestedPlayer)
                  requestedPlayer.tell(
                    `§cИгрок §f${player.name} §r§cудалил вас из строителей своей площадки`
                  )
              },
              'нет',
              () => form.show(player)
            )
          })
        }

        addBackButton(form)
        form.show(player)
      })

      const reqs = editRequest.list.size
      menu.addButton(
        `Запросы редактирования${reqs > 0 ? `: §c${reqs}!` : ''}`,

        () => {
          const newmenu = new ActionForm(
            'Запросы редактирования',
            '§3В этом меню вы можете посмотреть запросы на редактирование площадки, отправление другими игроками'
          )
          for (const ID of editRequest.list) {
            const name = Player.name(ID)
            newmenu.addButton(name ?? 'unnamed', () => {
              prompt(
                player,
                'Принимая запрос на редактирование, вы даете игроку право редактировать ваш регион.',
                'Принять',
                () => {
                  const requestedPlayer = Player.fetch(ID)
                  if (requestedPlayer) {
                    editRequest.deleteRequest(ID)
                    player.tell(
                      '§b> §3Запрос на редактирование успешно принят!'
                    )
                    requestedPlayer.tell(
                      `§b> §3Игрок §f${player.name} §r§3принял ваш запрос на редактирование площадки`
                    )
                    currentRegion.permissions.owners.push(requestedPlayer.id)
                    currentRegion.update()
                  } else {
                    player.tell('§4> §cИгрок не в сети.')
                  }
                },
                'Отклонить',
                () => {
                  editRequest.deleteRequest(ID)
                  newmenu.show(player)
                }
              )
            })
          }
          addBackButton(newmenu)
          newmenu.show(player)
        }
      )
      menu.addButton('Перейти на новую', () => {
        const CD = new Cooldown(DB, 'ARHCIVE', player, 1000 * 60 * 60 * 24)
        if (CD.isExpired())
          prompt(
            player,
            '§fВы уверены, что хотите перейти на новую площадку? После этого настощая площадка будет архивирована, и §cвернуть её§f будет уже §cнельзя§f. Это действие можно совершать раз в 24 часа.',
            '§cДа, перейти',
            () => {
              const oldRegionID = DB[player.id]?.id
              const oldRegion = Region.regions.find(e => e.key === oldRegionID)

              if (!oldRegion) return

              DB['ARCHIVE:' + oldRegionID] = {
                archiveOwners: [...oldRegion.permissions.owners],
              }
              /** @type {string[]} */
              const u = []
              oldRegion.forEachOwner((player, i, arr) => {
                u.push(player.id)
                player.tell(
                  '§cРегион игрока §f' + arr[0].name + '§r§c был заархивирован.'
                )
              })

              oldRegion.permissions.owners = []
              oldRegion.update()

              for (const builder of world.getPlayers()) {
                if (!u.includes(builder.id) && is(builder.id, 'builder'))
                  builder.tell(
                    '§b> §3Игрок §f' +
                      player.name +
                      '§r§3 перевел свою площадку в архив.'
                  )
              }

              createRegion(player, true)
              CD.update()
            },
            'Отмена',
            () => {}
          )
      })
      menu.addButton('§cОчистить', () => {
        const CD = new Cooldown(DB, 'CLEAR', player, 1000 * 60)
        if (CD.isExpired())
          prompt(
            player,
            '§fВы уверены что хотите §cбезвозвратно§f очистить площадку§f? Это действие §cнельзя отменить.',
            '§cВсе равно очистить§r',
            async () => {
              CD.update()
              const end = await clearRegion(player, playerRegion)
              await util.catch(() =>
                fillRegion(playerRegion.from, playerRegion.to)
              )
              end()
            },
            'Отмена, не очищайте',
            () => menu.show(player)
          )
      })
    } else if (currentRegion.permissions.owners.includes(player.id)) {
      // A?
    } else if (currentRegion.permissions.owners[0]) {
      menu.addButton('Запросить разрешение', () => {
        const CD = new Cooldown(DB, 'REQ', player, 1000 * 60)

        if (CD.isExpired())
          prompt(
            player,
            'Владельцу площадки будет отправлен запрос на редактирование. Если он его примет, вы сможете строить на его площадке.',
            'Запросить',
            () => {
              CD.update()
              editRequest.createRequest(player.id)
              player.tell('§b> §3Запрос на редактирование успешно отправлен!')
              const requestedPlayer = Player.fetch(
                currentRegion.permissions.owners[0]
              )
              if (requestedPlayer)
                requestedPlayer.tell(
                  `§b> §3Игрок §f${player.name} §r§3отправил вам запрос на редактирование площадки`
                )
            },
            'Отмена',
            () => menu.show(player)
          )
      })
    }
    if (is(player.id, 'admin')) {
      menu.addButton('§cУдалить площадку', () => {
        prompt(
          player,
          `§cВы действительно хотите удалить площадку игрока §r§f${regionOwnerName}?`,
          '§cДа',
          async () => {
            const end = await clearRegion(player, currentRegion)
            currentRegion.forEachOwner(player =>
              player.tell(
                `§cРегион с владельцем §f${regionOwnerName}§r§c был удален`
              )
            )
            currentRegion.delete()
            end()
          },
          'НЕТ!',
          () => menu.show(player)
        )
      })
    }
  }

  return menu
}
