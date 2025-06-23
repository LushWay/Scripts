import { Player, system } from '@minecraft/server'
import { table } from 'lib/database/abstract'
import { Mail } from 'lib/mail'
import { l, t } from 'lib/text'
import { Rewards } from 'lib/utils/rewards'
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

    this.database.set(name, {
      members: [player.id],
      owners: [player.id],

      name,
      shortname,

      invites: [],
      joinRequests: [],

      createdAt: new Date().toISOString(),
    })

    return new Clan(name, this.database.get(name))
  }

  private static instances = new Map<string, Clan>()

  static {
    system.run(() => {
      for (const [id, db] of this.database.entries()) new Clan(id, db)
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
      db = Clan.database.get(id)
      if (!db) throw new ReferenceError(l.error`Clan with id ${id} does not exists.`)
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
      t.nocolor`Вы выгнаны из клана '${this.db.name}'`,
      t`Вы были выгнаны из клана игроком '${whoKicked}'. Причина: ${message}`,
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
      t.nocolor`Приглашение в клан '${this.db.name}'`,
      t`Вы были приглашены в клан! Чтобы вступить, используйте .clan или раздел кланов из основого меню`,
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
      t.nocolor`Запрос на вступление в клан от ${player.name}`,
      t`Игрок хочет вступить в ваш клан, вы можете принять или отклонить его через меню кланов`,
      new Rewards(),
    )
    this.db.joinRequests.push(player.id)
    player.success(`Заявка на вступление в клан '${this.db.name}' отправлена!`)
  }

  add(playerOrId: Player | string) {
    const id = playerOrId instanceof Player ? playerOrId.id : playerOrId
    const message = t.nocolor`Вы приняты в клан ${this.db.name}`
    if (playerOrId instanceof Player) {
      playerOrId.success(message)
    } else Mail.send(id, message, t`Ура`, new Rewards())

    for (const clan of Clan.getAll()) {
      clan.db.joinRequests = clan.db.joinRequests.filter(e => e !== id)
      clan.db.invites = clan.db.invites.filter(e => e !== id)
    }
    this.db.members.push(id)
  }

  delete() {
    Mail.sendMultiple(
      this.db.members,
      t.nocolor`Клан '${this.db.name}' распущен`,
      t`К сожалению, клан был распущен. Хз че создателю не понравилось, найдите клан получше или создайте новый, печалиться смысла нет. Ну базы еще можете залутать, врятли создатель успел вас удалить из всех клановых баз.`,
      new Rewards(),
    )
    Clan.database.delete(this.id)
    Clan.instances.delete(this.id)
  }
}
