export function parse (text, type) {
  if (type == 'shop.lore') {
    return {
      price: Number(text[1].split(': ')[1]),
      balance: Number(text[2].split(': ')[1])
    }
  }
}