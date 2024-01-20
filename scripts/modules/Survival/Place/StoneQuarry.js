import { Player } from '@minecraft/server'
import { MinecraftEntityTypes } from '@minecraft/vanilla-data.js'
import { EditableNpc } from 'lib/Class/EditableNpc.js'
import { Store } from 'lib/Class/Store.js'
import { DefaultPlaceWithSafeArea } from 'modules/Survival/utils/DefaultPlace.js'
import { ActionForm, Boss, util } from 'smapi.js'

// TODO Сделать платные печки

class StoneQuarryBuilder extends DefaultPlaceWithSafeArea {
  constructor() {
    super('Каменоломня')
  }
  witherBoss = new Boss({
    name: 'wither',
    displayName: 'Камнедробилка',
    entityTypeId: MinecraftEntityTypes.Wither,
    bossEvent: false,
    respawnTime: util.ms.from('hour', 1),
  })

  ovener = new EditableNpc({
    name: 'Печкин',
    id: 'ovener',
    onInteract: ({ player }) => this.openOvenerMenu(player),
  })

  ovenStore = Store.npc({
    id: 'ovener',
    name: 'Печкин',
    body: p => 'У меня ты можешь купить доступ к печкам\n\n' + this.ovenStore.store.defaultOptions.body(p),
    prompt: true,
  })

  /**
   * @param {Player} player
   */
  openOvenerMenu(player) {
    const form = new ActionForm('Печки', 'У меня вы можете купить доступ к печкам')

    form.show(player)
  }
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export const StoneQuarry = new StoneQuarryBuilder()
