new XCommand({
	type: "wb",
	name: "wand",
	description: "Выдет топор",
	role: "moderator",
}).executes((ctx) => {
	ctx.sender.runCommandAsync(`give @s we:wand`);
});
