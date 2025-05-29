import { CityInvestigating } from 'modules/places/lib/city-investigating-quest'
import { StoneQuarry } from 'modules/places/stone-quarry/stone-quarry'

export const stoneQuarryInvestigating = new CityInvestigating(StoneQuarry, (place, q, player) => {
  q.dialogue(place.commonOvener.npc)
    .body('Привет я печкин я продаю ключи к печкам сзвди меня вот да')
    .buttons(['Хорошо отлично я у тебя их куплю и переплавлю руду', ctx => ctx.next()])

  q.dialogue(place.foodOvener.npc)
    .body('Привет я едовой печкин я продаю ключи к печкам сзвди меня вот да')
    .buttons(['Хорошо отлично я у тебя их куплю и переплавлю еду', ctx => ctx.next()])

  q.dialogue(place.gunsmith.npc)
    .body('Привет я оружейник я прокачаю твое оружие')
    .buttons(['Хорошо отлично я у тебя его прокачаю', ctx => ctx.next()])

  q.dialogue(place.butcher.npc).body('').buttons()

  q.dialogue(place.barman.npc).body('').buttons()

  q.dialogue(place.auntzine.npc).body('').buttons()

  q.dialogue(place.scavenger.npc).body('').buttons()
})
