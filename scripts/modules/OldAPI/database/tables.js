import { ItemDatabase } from "./types/Item";
import { ScoreboardDatabase } from "./types/Scoreboard";
//import { DynamicPropertysDatabase } from "./types/DynamicPropertys.js"
/*
|--------------------------------------------------------------------------
| Scoreboard Databases
|--------------------------------------------------------------------------
|
| This is a list of all then Scoreboard Database consts each one
| registers the database instance on world load to add a new
| one simply construct a new ScoreboardDatabase instance
|
*/

export let basic = new ScoreboardDatabase("default");
export let permissions = new ScoreboardDatabase("permissions");
export let chests = new ScoreboardDatabase('chests')
export let pos = new ScoreboardDatabase('pos')
export let kits = new ScoreboardDatabase('kits')
export let drops = new ScoreboardDatabase('drop')
export let lb = new ScoreboardDatabase('liderboards')

/*
|--------------------------------------------------------------------------
| Item Databases
|--------------------------------------------------------------------------
|
| This is a list of all then item Database consts each one
| registers the database instance on world load to add a new
| one simply construct a new ItemDatabase instance
|
*/

//export let sett = new DynamicPropertysDatabase('set')
export let i = new ItemDatabase('items')