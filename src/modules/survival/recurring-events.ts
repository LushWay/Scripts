import { Player, TicksPerSecond, world } from "@minecraft/server";
import {
	MinecraftEffectTypes,
	MinecraftEffectTypesUnion,
} from "@minecraft/vanilla-data";
import { ms, RoadRegion } from "lib";
import { form } from "lib/form/new";
import { i18n } from "lib/i18n/text";
import { DurationalRecurringEvent } from "lib/recurring-event";
import { RegionEvents } from "lib/region/events";
import later from "lib/utils/later";

// TODO Add settings for players to not apply effects on them
// TODO Add command to show menu to view events
// TODO Add a way to trigger event right now in the menu by using leafs (should be separated from the regular ones and with the bigger amplifier, and regular ones should not intersect with custom ones)
// TODO Add menu to the survival menu
// TODO Add chat notification

class RecurringEffect {
	static all: RecurringEffect[] = [];

	readonly event: DurationalRecurringEvent;

	constructor(
		readonly effectType: MinecraftEffectTypesUnion,
		readonly startingOn: number,
		filter?: (p: Player) => boolean,
		readonly amplifier = 2
	) {
		RecurringEffect.all.push(this);
		this.event = new DurationalRecurringEvent(
			`effect${effectType}`,
			later.parse.recur().every(5).hour().startingOn(startingOn),
			ms.from("min", 10),
			() => ({}),
			(_, ctx) => {
				for (const player of world.getAllPlayers()) {
					player.success(
						i18n.success`Событие! ${effectType} силой ${amplifier} на ${10} минут`
					);
				}
				ctx.temp.system.runInterval(
					() => {
						for (const player of world.getAllPlayers()) {
							if (filter && !filter(player)) continue;

							player.addEffect(
								MinecraftEffectTypes[effectType],
								TicksPerSecond * 3,
								{
									amplifier,
									showParticles: false,
								}
							);
						}
					},
					`effect${effectType}`,
					TicksPerSecond * 2
				);
			}
		);
	}
}

new RecurringEffect("Haste", 1);
new RecurringEffect("HealthBoost", 2);
new RecurringEffect(
	"Speed",
	3,
	(p) =>
		RegionEvents.playerInRegionsCache
			.get(p)
			?.some((e) => e instanceof RoadRegion) ?? false,
	4
);

export const recurForm = form((f, { self }) => {
	f.title(i18n`События`);
	f.body(i18n`Время: ${new Date().toHHMMSS()}`);

	const now = Date.now();
	for (const event of RecurringEffect.all) {
		const next = event.event.getNextOccurances(1)[0] ?? new Date();
		f.button(
			i18n`${event.effectType} ${event.amplifier + 1}\nЧерез ${i18n.time(
				next.getTime() - now
			)} (${next.toHHMM()})`,
			self
		);
	}
});
