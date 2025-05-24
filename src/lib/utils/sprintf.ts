/* eslint-disable */
// Source: https://github.com/gajus/fast-printf/
// Copyright (c) 2021, Gajus Kuizinas (http://gajus.com/)

type Flag = '-' | '-+' | '+' | '0'

type LiteralToken = {
  type: 'literal'
  literal: string
}

type PlaceholderToken = {
  conversion?: string
  flag: Flag | null
  placeholder: string
  position: number
  precision: number | null
  type: 'placeholder'
  width: number | null
}

type Token = LiteralToken | PlaceholderToken

const TokenRule =
  /(?:%(?<flag>([+0-]|-\+))?(?<width>\d+)?(?<position>\d+\$)?(?<precision>\.\d+)?(?<conversion>[%BCESb-iosux]))|(\\%)/g

const tokenize = (subject: string): Token[] => {
  let matchResult

  const tokens: Token[] = []

  let argumentIndex = 0
  let lastIndex = 0
  let lastToken: Token | null = null

  while ((matchResult = TokenRule.exec(subject)) !== null) {
    if (matchResult.index > lastIndex) {
      lastToken = {
        literal: subject.slice(lastIndex, matchResult.index),
        type: 'literal',
      }

      tokens.push(lastToken)
    }

    const match = matchResult[0]

    lastIndex = matchResult.index + match.length

    if (match === '\\%' || match === '%%') {
      if (lastToken && lastToken.type === 'literal') {
        lastToken.literal += '%'
      } else {
        lastToken = {
          literal: '%',
          type: 'literal',
        }

        tokens.push(lastToken)
      }
    } else if (matchResult.groups) {
      lastToken = {
        conversion: matchResult.groups.conversion,
        flag: (matchResult.groups.flag as Flag) || null,
        placeholder: match,
        position: matchResult.groups.position ? Number.parseInt(matchResult.groups.position, 10) - 1 : argumentIndex++,
        precision: matchResult.groups.precision ? Number.parseInt(matchResult.groups.precision.slice(1), 10) : null,
        type: 'placeholder',
        width: matchResult.groups.width ? Number.parseInt(matchResult.groups.width, 10) : null,
      }

      tokens.push(lastToken)
    }
  }

  if (lastIndex <= subject.length - 1) {
    if (lastToken && lastToken.type === 'literal') {
      lastToken.literal += subject.slice(lastIndex)
    } else {
      tokens.push({
        literal: subject.slice(lastIndex),
        type: 'literal',
      })
    }
  }

  return tokens
}

type FormatUnboundExpression = (subject: string, token: PlaceholderToken, boundValues: any[]) => string

const formatDefaultUnboundExpression = (subject: string, token: PlaceholderToken): string => {
  return token.placeholder
}

interface Configuration {
  formatUnboundExpression: FormatUnboundExpression
}

type Printf = (subject: string, ...boundValues: any[]) => string

const padValue = (value: string, width: number, flag: Flag | null): string => {
  if (flag === '-') {
    return value.padEnd(width, ' ')
  } else if (flag === '-+') {
    return ((Number(value) >= 0 ? '+' : '') + value).padEnd(width, ' ')
  } else if (flag === '+') {
    return ((Number(value) >= 0 ? '+' : '') + value).padStart(width, ' ')
  } else if (flag === '0') {
    return value.padStart(width, '0')
  } else {
    return value.padStart(width, ' ')
  }
}

const createPrintf = (configuration?: Configuration): Printf => {
  const formatUnboundExpression = configuration?.formatUnboundExpression ?? formatDefaultUnboundExpression

  const cache: Record<string, Token[]> = {}

  return (subject, ...boundValues) => {
    let tokens = cache[subject]

    if (!tokens) {
      tokens = cache[subject] = tokenize(subject)
    }

    let result = ''

    for (const token of tokens) {
      if (token.type === 'literal') {
        result += token.literal
      } else {
        let boundValue = boundValues[token.position]

        if (boundValue === undefined) {
          result += formatUnboundExpression(subject, token, boundValues)
        } else if (token.conversion === 'b') {
          result += boundValue ? 'true' : 'false'
        } else if (token.conversion === 'B') {
          result += boundValue ? 'TRUE' : 'FALSE'
        } else if (token.conversion === 'c') {
          result += boundValue
        } else if (token.conversion === 'C') {
          result += String(boundValue).toUpperCase()
        } else if (token.conversion === 'i' || token.conversion === 'd') {
          boundValue = String(Math.trunc(boundValue))

          if (token.width !== null) {
            boundValue = padValue(boundValue, token.width, token.flag)
          }

          result += boundValue
        } else if (token.conversion === 'e') {
          result += Number(boundValue).toExponential()
        } else if (token.conversion === 'E') {
          result += Number(boundValue).toExponential().toUpperCase()
        } else if (token.conversion === 'f') {
          if (token.precision !== null) {
            boundValue = Number(boundValue).toFixed(token.precision)
          }

          if (token.width !== null) {
            boundValue = padValue(String(boundValue), token.width, token.flag)
          }

          result += boundValue
        } else if (token.conversion === 'o') {
          result += (Number.parseInt(String(boundValue), 10) >>> 0).toString(8)
        } else if (token.conversion === 's') {
          if (token.width !== null) {
            boundValue = padValue(String(boundValue), token.width, token.flag)
          }

          result += boundValue
        } else if (token.conversion === 'S') {
          if (token.width !== null) {
            boundValue = padValue(String(boundValue), token.width, token.flag)
          }

          result += String(boundValue).toUpperCase()
        } else if (token.conversion === 'u') {
          result += Number.parseInt(String(boundValue), 10) >>> 0
        } else if (token.conversion === 'x') {
          boundValue = (Number.parseInt(String(boundValue), 10) >>> 0).toString(16)

          if (token.width !== null) {
            boundValue = padValue(String(boundValue), token.width, token.flag)
          }

          result += boundValue
        } else {
          throw new Error('Unknown format specifier.')
        }
      }
    }

    return result
  }
}

export const sprintf = createPrintf()
