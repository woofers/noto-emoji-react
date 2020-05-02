const data = require('../data/emoji')
const svgr = require('@svgr/core').default
const fs = require('fs')
const path = require('path')
const dir = path.join(__dirname, '../noto/svg');
const out = path.join(__dirname, '../lib');

const uppercase = word => word.charAt(0).toUpperCase() + word.slice(1)

const convertNames = data => {
  const table = {
    "1stPlaceMedal": 'GoldMedal',
    "2ndPlaceMedal": 'SilverMedal',
    "3rdPlaceMedal": 'BronzeMedal'
  }
  return Object.fromEntries(Object.entries(data).map(([key, { file, name }]) => {
    const symbols = name.replace(/(:|,|“|”|-|!|’|\.)/g, '').replace(/ *\([^)]*\) */g, '')
    const words = symbols.split(' ').map(uppercase)
    const next = words.join('')
    return [key, { file, name: table[next] || next }]
  }))
}

const emojis = convertNames(data)

for (const emoji of Object.values(emojis)) {
  const { name, file } = emoji
  fs.readFile(`${dir}/${file}`, 'utf8', (err, data) => {
    if (err) {
      console.log(`Could not read ${file}`)
      return
    }
    svgr(data, { icon: true }, { componentName: name }).then(code => {
      fs.writeFile(`${out}/${name}.js`, code, (err) => {
        if (err) {
          console.log(`Could not write ${name}.js`)
          return
        }
      })
    })
  })
}
