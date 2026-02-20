import { Cooldown } from 'lib/cooldown'
import { form } from 'lib/form/new'
import { getFullname } from 'lib/get-fullname'
import { i18n } from 'lib/i18n/text'

interface CooldownController {
  list(): Record<string, number>
  reset(id: string): void
}

// After compilation the initialization of this variable is placed lower then the hoisted call of the function below for some reason
let cds: { name: string; cd: CooldownController }[] | undefined

/**
 * Use cooldown controller when the cooldown IS NOT AN INSTANCE OF COOLDOWN, e.g. its some custom data structure
 */
export function registerResettableCooldown(name: string, cd: CooldownController | Cooldown) {
  cds ??= []

  if (cd instanceof Cooldown) {
    cds.push({
      name,
      cd: {
        list() {
          return Object.map(Cooldown.getDb(cd) as Record<string, number>, (k, v) =>
            Cooldown.getTime(cd) + v < Date.now() ? false : [k, Cooldown.getTime(cd) + v],
          )
        },
        reset(id) {
          // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
          delete Cooldown.getDb(cd)[id]
        },
      },
    })
  } else {
    cds.push({ name, cd })
  }
}

const cdsform = form(f => {
  f.title('Кулдауны')
  for (const cd of cds ?? []) {
    f.button(cdform(cd))
  }
})

const cdform = form.params<{ cd: CooldownController; name: string }>((f, { params, self }) => {
  const list = params.cd.list()
  f.title(i18n.join`${params.name}`.size(Object.keys(list).length))
  for (const [id, time] of Object.entries(list)) {
    const elapsed = time - Date.now()
    if (elapsed < 0) continue
    f.button(i18n`${getFullname(id)}\n${i18n.hhmmss(elapsed)}`, () => {
      params.cd.reset(id)
      self()
    })
  }
})

new Command('cooldownreset')
  .setPermissions('techAdmin')
  .setDescription('Сбрасывает разные кулдауны')
  .executes(cdsform.command)
