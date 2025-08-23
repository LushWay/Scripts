import { Player, system } from '@minecraft/server'
import { table } from 'lib/database/abstract'
import { i18n, noI18n } from 'lib/i18n/text'
import { Mail } from 'lib/mail'
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
      if (!db) throw new ReferenceError(noI18n.error`Clan with id ${id} does not exists.`)
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
      i18n.nocolor`Вы выгнаны из клана '${this.db.name}'`,
      i18n`Вы были выгнаны из клана игроком '${whoKicked}'. Причина: ${message}`,
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
      i18n.nocolor`Приглашение в клан '${this.db.name}'`,
      i18n`Вы были приглашены в клан! Чтобы вступить, используйте .clan или раздел кланов из основого меню`,
      new Rewards(),
    )
    return true
  }

  requestJoin(player: Player) {
    if (Clan.getPlayerClan(player.id)) return
    if (this.db.joinRequests.includes(player.id))
      return player.fail(i18n.error`Вы отправили заявку в клан ${this.db.name}!`)

    Mail.sendMultiple(
      this.db.owners,
      i18n.nocolor`Запрос на вступление в клан от ${player.name}`,
      i18n`Игрок хочет вступить в ваш клан, вы можете принять или отклонить его через меню кланов`,
      new Rewards(),
    )
    this.db.joinRequests.push(player.id)
    player.success(i18n`Заявка на вступление в клан '${this.db.name}' отправлена!`)
  }

  add(playerOrId: Player | string) {
    const id = playerOrId instanceof Player ? playerOrId.id : playerOrId
    const message = i18n.nocolor`Вы приняты в клан ${this.db.name}`
    if (playerOrId instanceof Player) {
      playerOrId.success(message)
    } else Mail.send(id, message, i18n`Ура`, new Rewards())

    for (const clan of Clan.getAll()) {
      clan.db.joinRequests = clan.db.joinRequests.filter(e => e !== id)
      clan.db.invites = clan.db.invites.filter(e => e !== id)
    }
    this.db.members.push(id)
  }

  delete() {
    Mail.sendMultiple(
      this.db.members,
      i18n.nocolor`Клан '${this.db.name}' распущен`,
      i18n`К сожалению, клан был распущен. Хз че создателю не понравилось, найдите клан получше или создайте новый, печалиться смысла нет. Ну базы еще можете залутать, врятли создатель успел вас удалить из всех клановых баз.`,
      new Rewards(),
    )
    Clan.database.delete(this.id)
    Clan.instances.delete(this.id)
  }
}
