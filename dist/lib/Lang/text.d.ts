export const text: {
    "api.name": () => string;
    "api.error.unknown": () => string;
    "api.database.error.table_name": (a: any, b: any) => string;
    "api.utilities.formatter.error.ms": (a: any) => string;
    "api.Providers.form.invaildtype": (a: any, b: any) => string;
    "api.Providers.form.invaildFormtype": (a: any, b: any) => void;
    "br.start": (a: any, b: any, c: any) => string;
    "br.end.time": (a: any) => string;
    "br.end.spec": (a: any) => string;
    "br.end.winner": (a: any) => string;
    "br.end.looser": (a: any, b: any) => string;
    "br.end.draw": () => string;
    "shop.lore": (price: any, balance: any) => string[];
    "shop.notenought": (price: any, balance: any) => string;
    "shop.suc": (a: any, b: any, price: any, balance: any) => string;
    stats: (hrs: any, min: any, sec: any, ahrs: any, amin: any, asec: any, dhrs: any, dmin: any, dsec: any, kills: any, deaths: any, hget: any, hgive: any, bplace: any, Bbreak: any, fla: any) => string;
};
