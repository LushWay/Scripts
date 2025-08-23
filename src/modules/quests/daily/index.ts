import { Player } from '@minecraft/server'
import { doNothing, noNullable } from 'lib'
import { table } from 'lib/database/abstract'
import { form } from 'lib/form/new'
import { intlListFormat } from 'lib/i18n/intl'
import { i18n, textTable } from 'lib/i18n/text'
import { questMenuCustomButtons } from 'lib/quest/menu'
import { DailyQuest } from 'lib/quest/quest'
import { RecurringEvent } from 'lib/recurring-event'
import later from 'lib/utils/later'
import { City } from 'modules/places/lib/city'
import { CityInvestigating } from 'modules/places/lib/city-investigating-quest'

const dailyQuests = 4

const questsStreakToGainDonutCrate = 4

let currentDailyQuests: DailyQuest[] = []
let currentDailyQuestCity: City | undefined

interface DB {
  streak: number
  streakDate: number
  today: number
  takenToday: boolean
}

const db = table<DB>('dailyQuest', () => ({ streak: 0, today: 0, streakDate: Date.now(), takenToday: false }))

new RecurringEvent(
  'dailyQuest',
  later.parse.recur().on('00:00').time(),
  () => ({ questIds: [] as string[], cityId: '' as string }),
  (storage, ctx) => {
    let quests = [...DailyQuest.dailyQuests.values()]
    currentDailyQuests = []

    if (ctx.restoreAfterOffline && storage.questIds.length && storage.cityId) {
      for (const questId of storage.questIds) {
        const quest = quests.find(e => e.id === questId)
        if (quest) currentDailyQuests.push(quest)
      }
      currentDailyQuestCity = City.places.find(e => e.group.id === storage.cityId) as City | undefined
      return
    }

    for (let i = 0; i < dailyQuests; i++) {
      const quest = quests.randomElement()
      quests = quests.filter(e => e !== quest)
      if (typeof quest !== 'undefined') {
        currentDailyQuests.push(quest)
      }
    }

    storage.questIds = currentDailyQuests.map(e => e.id)

    const cities = currentDailyQuests
      .map(quest => City.places.find(e => e.group === quest.place.group))
      .filter(noNullable)
      .filter(e => e instanceof City)

    const questCityCount = new Map<City, number>()
    for (const city of cities) questCityCount.set(city, questCityCount.get(city) ?? 0)

    const mostPopular = [...questCityCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]

    currentDailyQuestCity = mostPopular
    storage.cityId = mostPopular?.group.id ?? ''

    for (const value of db.values()) {
      if (!value.takenToday) value.streak = 0
      value.today = 0
      value.takenToday = false
    }
  },
  { runAfterOffline: true },
)

function hasAccessToDaily(player: Player, tell = true, fn = (t: Text) => player.tell(t)) {
  const completed = CityInvestigating.list.filter(e => e.quest.hadEntered(player))
  if (completed.length !== CityInvestigating.list.length) {
    if (tell) {
      const notVisited = CityInvestigating.list.filter(e => !completed.includes(e)).map(e => e.city.group.sharedName)
      fn(
        i18n.error`Сходите во все поселения, чтобы открыть ежедневные задания. Вы еще не посетили: ${intlListFormat(i18n.error.style, player.lang, 'and', notVisited)}`,
      )
    }
    return false
  } else return true
}

DailyQuest.onEnd.subscribe(({ quest, player }) => {
  if (!(quest instanceof DailyQuest)) return

  if (!currentDailyQuests.includes(quest)) return
  const playerDb = db.get(player.id)
  playerDb.today++

  if (playerDb.today >= dailyQuests) {
    playerDb.streak++
  }
})

new Command('daily').setDescription(i18n`Ежедневные задания`).executes(ctx => {
  if (!hasAccessToDaily(ctx.player)) return

  dailyQuestsForm.show(ctx.player)
})

questMenuCustomButtons.subscribe(({ player, form }) => {
  if (
    hasAccessToDaily(player, true, error => {
      form.button(i18n.join`${i18n.disabled`Ежедневные задания`}\n${error}`.to(player.lang), () => player.fail(error))
    })
  ) {
    const playerDb = db.get(player.id)
    form.button(i18n.accent`Ежедневные задания`.badge(dailyQuests - playerDb.today).to(player.lang), dailyQuestsForm.show)
  }
})

export const dailyQuestsForm = form((f, { player }) => {
  const playerDb = db.get(player.id)
  f.title(i18n`Ежедневные задания`)
  f.body(
    i18n`Каждый день, в 00:00, обновляются ежедневные задания. Они одинаковы для всех игроков. За выполнение всех ${dailyQuests} заданий вам дают награду. За выполнение всех ежедневных заданий ${questsStreakToGainDonutCrate} дня подряд вместо обычного ключа выдается донатный\n\n${textTable([[i18n`Выполнено подряд`, playerDb.streak]])}`,
  )

  const name = currentDailyQuestCity?.group.name
  if (name) {
    const completed = playerDb.today < dailyQuests
    f.button(
      (completed
        ? playerDb.takenToday
          ? i18n.restyle({ text: '§8', unit: '§7', num: '§7' })
          : i18n
        : i18n.error)`${playerDb.today}/${dailyQuests} Награда: ключ от сундука\n${name}`,
      () => {
        if (!completed) return player.fail(i18n.error`Сначала выполните все ежедневные задания!`)
        if (playerDb.takenToday) return player.fail(i18n.error`Вы уже забрали награды сегодня! Заходите завтра`)

        const donut = playerDb.streak > 0 && playerDb.streak % questsStreakToGainDonutCrate === 0
        const crate = donut ? currentDailyQuestCity?.donutCrate : currentDailyQuestCity?.normalCrate
        if (!crate) return

        player.success(i18n`Вы получили ключ!`)
        player.container?.addItem(crate.createKeyItemStack())
        playerDb.takenToday = true
      },
    )
  }

  for (const quest of currentDailyQuests) {
    f.quest(quest)
  }
})
