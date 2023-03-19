import { Player, world } from "@minecraft/server";
import { ActionForm } from "../../lib/Form/ActionForm.js";
import { ModalForm } from "../../lib/Form/ModelForm.js";
import { getRole, IS, ROLES, setRole, T_roles as TR, XA } from "../../xapi.js";
const DB = XA.tables.roles;
const R = new XA.Command({
    name: "role",
    description: "Показывает вашу роль",
});
R.executes((ctx) => {
    const noAdmins = !DB.values().includes("admin");
    const isAdmin = IS(ctx.sender.id, "admin");
    const needAdmin = ctx.args[0] === "ACCESS";
    const beenAdmin = DB.has(`SETTER:` + ctx.sender.id) && !isAdmin;
    if (noAdmins && (needAdmin || beenAdmin)) {
        setRole(ctx.sender.id, "admin");
        return ctx.reply("§b> §r" + TR.admin);
    }
    const role = getRole(ctx.sender.id);
    if (!isAdmin)
        return ctx.reply(`§b> §r${TR[role]}`);
    /**
     *
     * @param {Player} player
     * @returns
     */
    const callback = (player, fakeChange = false) => {
        return () => {
            const role = getRole(player.id);
            const ROLE = Object.keys(ROLES).map((e) => `${role === e ? "> " : ""}` + TR[e]);
            new ModalForm(player.name)
                .addToggle("Уведомлять", false)
                .addToggle("Показать Ваш ник в уведомлении", false)
                .addDropdown("Роль", ROLE, ROLE.findIndex((e) => e.startsWith(">")))
                .addTextField("Причина смены роли", `Например, "космокс"`)
                .show(ctx.sender, (_, notify, showName, selected, message) => {
                if (selected.startsWith(">"))
                    return;
                const newrole = Object.entries(TR).find((e) => e[1] === selected)[0];
                if (notify)
                    player.tell(`§b> §3Ваша роль сменена c ${TR[role]} §3на ${selected}${showName ? `§3 игроком §r${ctx.sender.name}` : ""}${message ? `\n§r§3Причина: §r${message}` : ""}`);
                // @ts-expect-error
                setRole(player.id, newrole);
                // @ts-expect-error
                if (fakeChange)
                    DB.set(`SETTER:` + player.id, 1);
            });
        };
    };
    const form = new ActionForm("Roles", "§3Ваша роль: " + TR[role]).addButton("Сменить мою роль", null, callback(ctx.sender, true));
    for (const player of world.getPlayers({ excludeNames: [ctx.sender.name] }))
        form.addButton(player.name, null, callback(player));
    form.show(ctx.sender);
});
