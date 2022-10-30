/**
 * @typedef {Object} gun
 * @property {String} type
 * @property {number} maxAmmo
 * @property {number} reloadTime
 * @property {String} scoreName the name of this item
 */


export const guns = {
  akm: {
    type: "assault",
    maxAmmo: 30,
    reloadTime: 2.7,
    scoreName: 'akm',
  }
}

 export const gs = {
  ak12: {
    type: "assault",
    maxAmmo: 30,
    reloadTime: 2.7,
    scoreName: 'ak12',
  },
  m1911: {
    type: "assault",
    maxAmmo: 10,
    reloadTime: 2,
    scoreName: 'm1911',
  }
}