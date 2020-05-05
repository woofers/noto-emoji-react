const data = require('../data/emoji')
const svgr = require('@svgr/core').default
const fs = require('fs')
const path = require('path')
const dir = path.join(__dirname, '../noto/svg-baked');
const out = path.join(__dirname, '../lib');
const template = require('./template')

const writeFile = (file, content) => {
  fs.writeFile(`${out}/${file}.js`, content, (err) => {
    if (err) {
      console.log(`Could not write ${file}.js`)
      return
    }
  })
}

const readFile = (filename) => {
  return new Promise((resolve, reject) => {
    fs.readFile(filename, 'utf-8', (err, buffer) => {
      if (err) return reject(err)
      resolve(buffer)
    })
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

const code = async () => {
  let ex = ''
  const emojis = convertNames(data)
  let index = `var React = require('react')\n`
  for (const emoji of Object.values(emojis)) {
    const { name, file } = emoji
    const data = await readFile(`${dir}/${file}`)
    const config = {
      icon: true,
      plugins: ['@svgr/plugin-svgo', '@svgr/plugin-jsx'],
      svgo: true,
      template,
      svgoConfig: {
        plugins: [{
          cleanupIDs: {
            prefix: `${name}-`
          }
        }]
      },
      jsx: {
        babelConfig: {
          plugins: ['@babel/plugin-transform-react-jsx']
        }
      }
    }
    const code = await svgr(data, config, { componentName: name })
    lines = code.split('\n')
    index += '\n'
    if (lines[0].includes('function _extends()') && !ex) {
      ex = lines[0]
      index += `${ex}\n`
    }
    index += lines.slice(1).join('\n')
  }
  return index
}

(async () => {
  const index = await code()
  writeFile('index', index)
})()
