const data = require('../data/emoji')
const svgr = require('@svgr/core').default
const fs = require('fs')
const path = require('path')
const dir = path.join(__dirname, '../noto/svg-baked');
const out = path.join(__dirname, '../lib');

const writeFile = (file, content) => {
  fs.writeFile(`${out}/${file}.js`, content, (err) => {
    if (err) {
      console.log(`Could not write ${file}.js`)
      return
    }
  })
}

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

let index = ''

for (const emoji of Object.values(emojis)) {
  const { name, file } = emoji
  index += `export { default as ${name} } from './${name}'\n`
  fs.readFile(`${dir}/${file}`, 'utf8', (err, data) => {
    if (err) {
      console.log(`Could not read ${file}`)
      return
    }
    const config = {
      icon: true,
      plugins: ['@svgr/plugin-svgo', '@svgr/plugin-jsx'],
      svgo: true,
      svgoConfig: {
        plugins: [{
          cleanupIDs: {
            prefix: `${name}-`
          }
        }]
      },
      jsx: {
        babelConfig: {
          plugins: [[
            '@babel/plugin-transform-react-jsx',
            {
              useBuiltIns: true
            }
          ]]
        }
      }
    }
    svgr(data, config, { componentName: name }).then(code => {
      writeFile(name, code)
    })
  })
}

writeFile('index', index)
