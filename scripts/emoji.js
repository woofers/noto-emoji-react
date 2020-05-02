
const fs = require('fs')
const path = require('path')
const fetch = require('node-fetch')
const dir = path.join(__dirname, '../noto/svg');

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

const get = url => {
  const escaped = encodeURI(url).replace('#', '%23')
  return fetch(escaped).then(res => res.text())
}

const getName = (emoji, url) => {
  return new Promise((resolve, reject) => {
    const special = {
      "👨‍❤‍💋‍👨": '👨‍❤️‍💋‍👨',
      "👩‍❤‍💋‍👨": '👩‍❤️‍💋‍👨',
      "👩‍❤‍💋‍👩": '👩‍❤️‍💋‍👩',
      "󾠫": '🏴󠁧󠁤󠀰󠀵󠁿'
    }
    get(!url ? `https://emojipedia.org/search/?q=${special[emoji] || emoji}` : url).then(async text => {
      const lines = text.split('\n')
      const start = lines.indexOf('window.emojiData = {')
      if (start === -1) {
        const link = lines.filter(line => line.startsWith('<h2><a'))
        if (link.length === 0) return resolve('Unknown')
        const line = link[0]
        const reg = /href="([^"]*)/
        const matches = reg.exec(line)
        if (!matches) return resolve('Unknown')
        const deeper = await getName(emoji, `https://emojipedia.org${matches[1]}`)
        return resolve(deeper)
      }
      const at = start + 2
      const value = lines[at].replace(/,/g, '').replace('name', `"name"`).replace(/\'/g, '"')
      let obj
      try {
        obj = JSON.parse(`\{ ${value} \}`)
      }
      catch (e) {
        return resolve('Unknown')
      }
      return resolve(obj.name)
    })
  }).catch(err => console.log(err))
}

const obj = {}
fs.readdir(dir, (err, files) => {
  if (err) return console.log('Unable to scan directory: ' + err);
  files.forEach(file => {
    if (!file.includes('.svg')) return
    obj[toEmoji(file)] = { file }
  })
  next()
})

const next = async () => {
  const all = Object.keys(obj)
  for (const emoji of all) {
    const name = await getName(emoji)
    obj[emoji] = { ...obj[emoji], name }
  }
  dump()
}

const dump = () => {
  console.log('// THIS FILE IS AUTO GENERATED')
  process.stdout.write('module.exports = ')
  console.log(obj)
}
