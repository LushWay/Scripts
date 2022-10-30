export const lang = {}

class Locale {
  /**
   * 
   * @param {string} locale 
   * @param {Laungage} params 
   */
  constructor (locale = 'en', params) {
    lang[locale] = params
  }

}

new Locale('en', {
  err: {
    'as': 'a'
  }
})
