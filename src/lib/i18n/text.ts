import { Player, RawText } from "@minecraft/server";
import { defaultLang, Language } from "lib/assets/lang";
import { extractedTranslatedPlurals } from "lib/assets/lang-messages";
import { Vec } from "lib/vector";
import { separateNumberWithDots } from "../util";
import { stringify } from "../utils/inspect";
import { ms } from "../utils/ms";
import { intlPlural, intlRemaining } from "./intl";
import {
	I18nMessage,
	Message,
	RawTextArg,
	ServerSideI18nMessage,
	SharedI18nMessage,
	SharedI18nMessageJoin,
} from "./message";
export type MaybeRawText = string | RawText;

declare global {
	/** Text that can be displayed on player screen and should support translation */
	type Text = string | Message;

	type SharedText = import("lib/i18n/message").SharedI18nMessage;

	namespace Text {
		export interface Colors {
			/** Color of strings, objects and other messages */
			unit: string;
			/** Color of numbers and bigints */
			num: string;
			/** Color of regular template text i18n`Like this one` */
			text: string;
		}

		export interface Static<T> {
			/**
			 * @example
			 *   t.time(3000) -> "3 секунды"
			 */
			time(time: number): Message;

			/**
			 * @example
			 *   t.time(3000) -> "00:00:03"
			 *   t.time(ms.from('min', 32) + 1000) -> "00:32:01"
			 *   t.time(ms.from('day', 1) +  ms.from('min', 32) + 1000) -> "1 д. 00:32:01"
			 *   t.time(ms.from('day', 10000) +  ms.from('min', 32) + 1000) -> "10000 д. 00:32:01"
			 */
			hhmmss(time: number): SharedI18nMessage | string;

			restyle: (colors: Partial<Text.Colors>) => T;

			style: Text.Colors;
		}

		/** "§7Some long text §fwith substring§7 and number §64§7" */
		export type Fn<T, Arg> = (text: TemplateStringsArray, ...args: Arg[]) => T;

		export type FnWithJoin<T, Arg> = Fn<T, Arg> & { join: Fn<T, Arg> };

		interface Modifiers<T> {
			/** "§cSome long text §fwith substring§c and number §74§c" */
			error: T;

			/** "§eSome long text §fwith substring§e and number §64§e" */
			warn: T;

			/** "§aSome long text §fwith substring§a and number §64§a" */
			success: T;

			/** "§3Some long text §fwith substring§3 and number §64§3" */
			accent: T;

			/** "§8Some long text §7with substring§8 and number §74§8" */
			disabled: T;

			/** "§r§6Some long text §f§lwith substring§r§6 and number §f4§r§6" */
			header: T;

			/** "Some long text with substring and number 4" */
			nocolor: T;
		}
		export type Chained<T extends Fn<any, any>> = T &
			Static<Chained<T>> &
			Modifiers<T & Static<Chained<T>>>;

		export type Table = readonly (string | readonly [Text, unknown])[];
	}
}

export function textTable(table: Text.Table): Message {
	return new ServerSideI18nMessage(defaultColors(), (lang) => {
		const long = table.length > 5;
		return table
			.map((v, i) => {
				if (typeof v === "string") return "";

				const [key, value] = v;
				return `${i % 2 === 0 && long ? "§f" : "§7"}${key.to(
					lang
				)}: ${textUnitColorize(value, undefined, lang)}`;
			})
			.join("\n");
	});
}

function createStyle(colors: Text.Colors) {
	return Object.freeze(colors);
}

const styles = {
	nocolor: createStyle({ text: "", unit: "", num: "" }),
	header: createStyle({ text: "§r§6", num: "§f", unit: "§f§l" }),
	error: createStyle({ num: "§7", text: "§c", unit: "§f" }),
	warn: createStyle({ num: "§6", text: "§e", unit: "§f" }),
	accent: createStyle({ num: "§6", text: "§3", unit: "§f" }),
	success: createStyle({ num: "§6", text: "§a", unit: "§f" }),
	disabled: createStyle({ num: "§7", text: "§8", unit: "§7" }),
};

export const noI18n = createStatic(undefined, undefined, (colors) => {
	return function simpleStr(template, ...args) {
		return Message.concatTemplateStringsArray(
			defaultLang,
			template,
			args,
			colors
		);
	} as Text.Chained<Text.Fn<string, unknown>>;
});

export const i18n = createStatic(undefined, undefined, (colors) => {
	const i18n = ((template, ...args) =>
		new I18nMessage(template, args, colors)) as Text.FnWithJoin<
		I18nMessage,
		unknown
	>;

	i18n.join = (template, ...args) => new Message(template, args, colors);

	return i18n as Text.Chained<Text.FnWithJoin<I18nMessage, unknown>>;
});

export const i18nShared = createStatic(undefined, undefined, (colors) => {
	const i18n = ((template, ...args) =>
		new SharedI18nMessage(template, args, colors)) as Text.FnWithJoin<
		SharedI18nMessage,
		RawTextArg
	>;

	i18n.join = (template, ...args) =>
		new SharedI18nMessageJoin(template, args, colors);

	return i18n as Text.Chained<Text.FnWithJoin<SharedI18nMessage, RawTextArg>>;
});

export const i18nPlural = createStatic(undefined, undefined, (colors) => {
	return function i18nPlural(template, n) {
		const id = ServerSideI18nMessage.templateToId(template);
		return new ServerSideI18nMessage(colors, (l) => {
			const translated =
				extractedTranslatedPlurals[l]?.[id]?.[intlPlural(l, n)] ?? template;
			return ServerSideI18nMessage.concatTemplateStringsArray(
				l,
				translated,
				[n],
				colors,
				[]
			);
		});
	} as Text.Chained<
		(template: TemplateStringsArray, n: number) => ServerSideI18nMessage
	>;
});

function defaultColors(
	colors: Partial<Text.Colors> = {}
): Required<Text.Colors> {
	return {
		unit: colors.unit ?? "§f",
		text: colors.text ?? "§7",
		num: colors.num ?? "§6",
	};
}

function createStatic<T extends Text.Chained<Text.Fn<any, any>>>(
	colors: Partial<Text.Colors> = {},
	modifier = false,
	createFn: (colors: Text.Colors) => T
): T {
	const dcolors = defaultColors(colors);
	const fn = createFn(dcolors);
	fn.style = dcolors;
	fn.time = createTime(dcolors);
	fn.hhmmss = createTimeHHMMSS(dcolors);
	fn.restyle = (colors) => createStatic<T>(colors, false, createFn);

	if (!modifier) {
		fn.nocolor = createStatic(styles.nocolor, true, createFn);
		fn.header = createStatic(styles.header, true, createFn);
		fn.error = createStatic(styles.error, true, createFn);
		fn.warn = createStatic(styles.warn, true, createFn);
		fn.accent = createStatic(styles.accent, true, createFn);
		fn.success = createStatic(styles.success, true, createFn);
		fn.disabled = createStatic(styles.disabled, true, createFn);
	}
	return fn;
}

const dayMs = ms.from("day", 1);
function createTimeHHMMSS(colors: Text.Colors): Text.Static<never>["hhmmss"] {
	return (n) => {
		const hhmmss = new Date(n).toHHMMSS();
		if (n <= dayMs) return hhmmss;

		const days = ~~(n / dayMs);
		return i18nShared.restyle(colors)`${days} д. ${hhmmss}`;
	};
}

function createTime(colors: Text.Colors): Text.Static<never>["time"] {
	return (ms) => new ServerSideI18nMessage(colors, (l) => intlRemaining(l, ms));
}

export function textUnitColorize(
	v: unknown,
	{ unit, num }: Text.Colors = defaultColors(),
	lang: Language | false
): string {
	switch (typeof v) {
		case "string":
			if (v.includes("§l")) return unit + v + "§r";
			return unit + v;
		case "undefined":
			return "";
		case "object":
			if (v instanceof Message) {
				if (!lang) {
					throw new TypeError(
						`Text unit colorize cannot translate Message '${v.id}' if no locale was given!`
					);
				}

				const vstring = v.to(lang);
				return vstring.startsWith("§") ? vstring : unit + vstring;
			}
			if (v instanceof Player) {
				return unit + v.name;
			} else if (Vec.isVec(v)) {
				return Vec.string(v, true);
			} else return stringify(v);

		case "number":
			return `${num}${separateNumberWithDots(v)}`;
		case "symbol":
		case "function":
		case "bigint":
			return "§c<>";
		case "boolean":
			return (v ? i18n.nocolor`§fДа` : i18n.nocolor`§cНет`).to(
				lang || defaultLang
			);
	}
}
