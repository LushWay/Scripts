import { Player, system } from '@minecraft/server'
import { Mail } from 'lib'
import { table } from 'lib/database/abstract'
import { Rewards } from 'lib/shop/rewards'
import { t } from 'lib/text'
import './command'

interface StoredClan {
  members: string[]
  owners: string[]

  name: string
  shortname: string

  invites: string[]
  joinRequests: string[]

  createdAt: string
}

export class Clan {
  static database = table<StoredClan>('clan')

  static getPlayerClan(playerId: string) {
    for (const clan of this.instances.values()) {
      if (clan.isMember(playerId)) return clan
    }
  }

  static getAll() {
    return this.instances.values()
  }

  static create(player: Player, name: string, shortname: string) {
    while (name in this.database) name += '-'

    this.database[name] = {
      members: [player.id],
      owners: [player.id],

      name,
      shortname,

      invites: [],
      joinRequests: [],

      createdAt: new Date().toISOString(),
    }

    return new Clan(name, this.database[name])
  }

  private static instances = new Map<string, Clan>()

  static {
    system.run(() => {
      for (const [id, db] of Object.entries(this.database)) {
        new Clan(id, db)
      }
    })
  }

  db!: StoredClan

  constructor(
    private readonly id: string,
    db?: StoredClan,
  ) {
    const clan = Clan.instances.get(this.id)
    if (clan) return clan

    if (!db) {
      db = Clan.database[id]
      if (!db) throw new ReferenceError(t.error`Clan with id ${id} does not exists.`)
    } else this.db = db

    Clan.instances.set(this.id, this)
  }

  get createdAt() {
    return new Date(this.db.createdAt)
  }

  isMember(playerId: string) {
    return this.db.members.includes(playerId)
  }

  isOwner(playerId: string) {
    return this.db.owners.includes(playerId)
  }

  setRole(playerId: string, role: 'member' | 'owner') {
    if (role === 'member') this.db.owners = this.db.owners.filter(e => e !== playerId)
    if (role === 'owner') this.db.owners.push(playerId)
  }

  kickMember(playerId: string, whoKicked: string, message: string) {
    Mail.send(
      playerId,
      `Вы выгнаны из клана '${this.db.name}'`,
      `Вы были выгнаны из клана игроком '${whoKicked}'. Причина: ${message}`,
      new Rewards(),
    )
    this.db.members = this.db.members.filter(e => e !== playerId)
    this.db.owners = this.db.owners.filter(e => e !== playerId)
  }

  invite(playerId: string) {
    if (Clan.getPlayerClan(playerId)) return false

    this.db.invites.push(playerId)
    Mail.send(
      playerId,
      `Приглашение в клан '${this.db.name}'`,
      'Вы были приглашены в клан! Чтобы вступить, используйте .clan или раздел кланов из основого меню',
      new Rewards(),
    )
    return true
  }

  requestJoin(player: Player) {
    if (Clan.getPlayerClan(player.id)) return
    if (this.db.joinRequests.includes(player.id))
      return player.fail(t.error`Вы отправили заявку в клан ${this.db.name}!`)

    Mail.sendMultiple(
      this.db.owners,
      'Запрос на вступление в клан от ' + player.name,
      'Игрок хочет вступить в ваш клан, вы можете принять или отклонить его через меню кланов',
      new Rewards(),
    )
    this.db.joinRequests.push(player.id)
    player.success(`Заявка на вступление в клан '${this.db.name}' отправлена!`)
  }

  add(playerOrId: Player | string) {
    const id = playerOrId instanceof Player ? playerOrId.id : playerOrId
    const message = `Вы приняты в клан ${this.db.name}`
    if (playerOrId instanceof Player) {
      playerOrId.success(message)
    } else Mail.send(id, message, 'Ура', new Rewards())

    console.log({ db: this.db })
    for (const clan of Clan.getAll()) {
      clan.db.joinRequests = clan.db.joinRequests.filter(e => e !== id)
      clan.db.invites = clan.db.invites.filter(e => e !== id)
    }
    this.db.members.push(id)
    console.log({ db: this.db })
  }

  delete() {
    Mail.sendMultiple(
      this.db.members,
      `Клан '${this.db.name}' распущен`,
      'К сожалению, клан был распущен. Хз че создателю не понравилось, найдите клан получше или создайте новый, печалиться смысла нет. Ну базы еще можете залутать, врятли создатель успел вас удалить из всех клановых баз.',
      new Rewards(),
    )
    Reflect.deleteProperty(Clan.database, this.id)
    Clan.instances.delete(this.id)
  }
}
