
const fs = require('fs')
const path = require('path')

const dir = path.join(__dirname, 'noto/svg');

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

const toEmoji = value => {
  const removed = value.replace('emoji_u', '').replace('.svg', '')
  const parts = removed.split('_')
  return eval("'" + parts.map(b => `\\u\{${b}\}`).join('') + "'")
}

const escapeBytes = values => `emoji_u${values.join('_')}.svg`

const obj = {}
fs.readdir(dir, (err, files) => {
  if (err) return console.log('Unable to scan directory: ' + err);
  files.forEach(file => {
    if (!file.includes('.svg')) return
    obj[toEmoji(file)] = file
  })
  console.log(obj)
})
