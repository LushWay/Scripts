import { Player } from '@minecraft/server'
import { BUTTON, settingsModal } from 'lib'
import { noI18n } from 'lib/i18n/text'
import { WeakPlayerMap } from 'lib/weak-player-storage'
import { getReplaceMode, ReplaceMode } from 'modules/world-edit/utils/blocks-set'
import { REPLACE_MODES } from 'modules/world-edit/utils/default-block-sets'
import { ChestButton } from './set-selection'

export function useReplaceMode(player: Player, storage: WeakPlayerMap<ReplaceMode>, back: VoidFunction) {
  const replaceMode = storage.get(player) ?? getReplaceMode('')
  const localStorage = {
    replaceMode: Object.keys(REPLACE_MODES).find(e => REPLACE_MODES[e] === replaceMode) ?? 'По умолчанию',
  }
  const replaceModeButton: ChestButton = {
    icon: BUTTON.settings,
    nameTag: noI18n`Режим замены:\n${localStorage.replaceMode}`,
    callback(p) {
      settingsModal(
        p,
        {
          replaceMode: {
            name: 'Режим замены',
            value: Object.keys(REPLACE_MODES)
              .concat('По умолчанию')
              .map(e => [e, e]),

            onChange: () => storage.set(p, getReplaceMode(localStorage.replaceMode)),
          },
        },
        localStorage,
        back,
      )
    },
  }

  return [replaceMode, replaceModeButton] as const
}
