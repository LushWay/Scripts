import { LootTable } from "../Loot/loot.js";

const starter = new LootTable(
	{
		type: "woodenSword",
		chance: "100%",
		enchantments: {
			unbreaking: {
				"0...2": "50%",
				3: "50%",
			},
		},
	},
	{
		type: "leatherBoots",
		chance: "50%",
	},
	{
		type: "leatherLeggings",
		chance: "100%",
	},
	{
		type: "leatherChestplate",
		chance: "100%",
	},
	{
		type: "leatherHelmet",
		chance: "50%",
	}
);
