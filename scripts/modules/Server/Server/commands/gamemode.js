new XCommand({
	name: "s",
	description: "Выживание",
	role: "moderator",
}).executes((ctx) => {
	ctx.sender.runCommand("gamemode s");
	ctx.reply("§a► S");
});

new XCommand({
	name: "c",
	description: "Креатив",
	role: "moderator",
}).executes((ctx) => {
	ctx.sender.runCommand("gamemode c");
});
