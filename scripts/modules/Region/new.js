const db = new XA.instantDB(world, 'buildRegion')

function findFreePlace() {}

function CreateRegion(player) {
    const place = findFreePlace()
    const region = new Region(place.x, place.y, place.z)

}

world.events.playerJoin.subscribe(data => {
    const player = data.player

    if (db.has(player.id)) {
        const region = db.get(player.id)
        player.teleport(region.location)

    } else {
        player.tell(lang.newPlayer)
        CreateRegion(player)
    }
})


const menu = new CustomMenu()
.title("title")
.button("text", (ctx) => {})


const gui = "xa:menu";

const menu = () => {
    const a = new ActionFormData()
    .title("Меню")
    .button("Спавн")
    .button("Анархия")
    .button("Миниигры")
    .button("Статистика");

    return a;
};

world.events.beforeItemUse.subscribe(async (d) => {
    if (d.item.typeId !== gui || !(d.source instanceof Player)) return;
    menu(player).show(d.source)
})