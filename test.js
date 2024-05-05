new Command({ name: 'test', role: 'admin', alias: ['string'], other: 'value', requires: () => true }).literal({
  name: 'test',
  role: 'admin',
  alias: ['string'],
  other: 'value',
  requires: () => true,
})

new Command({
  name,
  aliases,
  description: commandDescription ?? `§bТелепорт на ${name}`,
  type: 'public',
  requires: allowAnybody ? () => true : undefined,
}).executes(ctx => {
  this.teleport(ctx.sender)
})
