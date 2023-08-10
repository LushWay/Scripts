new XCommand({
	type: "wb",
	name: "tool",
	description: "Gives a tool item in your inventory",
	role: "moderator",
}).executes((ctx) => {
	ctx.sender.runCommandAsync("give @s we:tool");
});
