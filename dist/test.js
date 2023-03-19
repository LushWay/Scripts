import { world } from "@minecraft/server";
world.debug = (...data) => {
    world.sendMessage(data.map((e) => JSON.stringify(e)).join(" "));
};
