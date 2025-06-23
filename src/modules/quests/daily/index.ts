import { Player } from '@minecraft/server'
import { noNullable } from 'lib'
import { table } from 'lib/database/abstract'
import { form } from 'lib/form/new'
import { DailyQuest } from 'lib/quest/quest'
import { RecurringEvent } from 'lib/recurring-event'
import { t, textTable } from 'lib/text'
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

function hasAccessToDaily(player: Player, tell = true) {
  const completed = CityInvestigating.list.filter(e => e.quest.hadEntered(player))
  if (completed.length !== CityInvestigating.list.length) {
    if (tell) {
      player.fail(
        t.error`Сходите во все поселения, чтобы открыть ежедневные задания. Вы еще не посетили: ${CityInvestigating.list
          .filter(e => !completed.includes(e))
          .map(e => e.city.group.name)
          .join(', ')}`,
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

new Command('daily').setDescription(t`Ежедневные задания`).executes(ctx => {
  if (!hasAccessToDaily(ctx.player)) return

  dailyQuestsForm.show(ctx.player)
})

export const dailyQuestsForm = form((f, player) => {
  const playerDb = db.get(player.id)
  f.title(t`Ежедневные задания`)
  f.body(
    t`Каждый день, в 00:00, обновляются ежедневные задания. Они одинаковы для всех игроков. За выполнение всех ${dailyQuests} заданий вам дают награду. За выполнение всех ежедневных заданий ${questsStreakToGainDonutCrate} дня подряд вместо обычного ключа выдается донатный\n\n${textTable({ 'Выполнено подряд': playerDb.streak })}`,
  )

  const name = currentDailyQuestCity?.group.name
  if (name) {
    const completed = playerDb.today < dailyQuests
    f.button(
      (completed
        ? playerDb.takenToday
          ? t.options({ text: '§8', unit: '§7', num: '§7' })
          : t
        : t.error)`${playerDb.today}/${dailyQuests} Награда: ключ от сундука\n${name}`,
      () => {
        if (!completed) return player.fail(t.error`Сначала выполните все ежедневные задания!`)
        if (playerDb.takenToday) return player.fail(t.error`Вы уже забрали награды сегодня! Заходите завтра`)

        const donut = playerDb.streak > 0 && playerDb.streak % questsStreakToGainDonutCrate === 0
        const crate = donut ? currentDailyQuestCity?.donutCrate : currentDailyQuestCity?.normalCrate
        if (!crate) return

        player.success(t`Вы получили ключ!`)
        player.container?.addItem(crate.createKeyItemStack())
        playerDb.takenToday = true
      },
    )
  }

  for (const quest of currentDailyQuests) {
    f.quest(quest)
  }
})
