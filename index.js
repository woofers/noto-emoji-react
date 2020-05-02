
const surrogatePair = (high, low) => (high - 0xD800) * 0x400 + low - 0xDC00 + 0x10000

const isPair = value => value > 0xFFFF

const toUnicodeBytes = value => {
  const bytes = []
  const tokens = value.split('')
  const add = el => bytes.push(el.toString(16))
  for (let i = 0; i < tokens.length; i ++) {
    const high = tokens[i].charCodeAt(0)
    if ((i + 1) >= tokens.length) {
      break
    }
    const low = tokens[i + 1].charCodeAt(0)
    const pair = surrogatePair(high, low)
    if (!isPair(pair)) {
      add(high)
    }
    else {
      add(pair)
      i ++
    }
  }
  return bytes
}

const escapeBytes = values => `emoji_u${values.join('_')}.svg`
