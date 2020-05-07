const data = require('../data/emoji')
const svgr = require('@svgr/core').default
const fs = require('fs')
const path = require('path')
const raw = path.join(__dirname, '../noto/svg')
const out = path.join(__dirname, '../lib')
const cli = require('child_process')
const util = require('util')
const exec = util.promisify(cli.exec)
const config = require('../config')
const mkdir = require('mkdirp')

const img = postfix => path.join(__dirname, `../noto/svg-${postfix}`)

const inkscape = async options => {
  try {
    return await exec(`inkscape ${options}`)
  }
  catch (e) {
    throw new Error(
      `inkscape not installed: install with 'sudo apt-get install inkscape'`
    )
  }
}

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

const fonts = [
  'emoji_u1f947.svg',
  'emoji_u1f948.svg',
  'emoji_u1f949.svg'
]

const convertSvg = async options => {
  const { name, size } = options
  const baked = img(name)
  const isVector = name === 'svg'
  mkdir(baked, {}, err => console.log(err))
  for (const emoji of (isVector ? fonts : Object.values(emojis).map(el => el.file))) {
    const options = (() => {
      if (isVector) return `--export-text-to-path --export-plain-svg=${baked}/${emoji}`
      return `-w ${size} -h ${size} --export-png=${baked}/${emoji.replace('.svg', '.png')} `
    })()
    const out = await inkscape(`${raw}/${emoji} ${options}`)
  }
}

const toReact = options => {
  if (options.name !== 'svg') return
  const baked = img(options.name)
  const svg = options.name === 'svg' ? raw : baked
  let index = ''
  for (const emoji of Object.values(emojis)) {
    const { name, file } = emoji
    index += `export { default as ${name} } from './${name}'\n`
    fs.readFile(`${fonts.includes(file) ? baked : svg}/${file}`, 'utf8', (err, data) => {
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
}

const make = async options => {
  try {
    await convertSvg(options)
  }
  catch (e) {
    console.log(e)
    return process.exit(2)
  }
 toReact(options)
}

(async () => {
  for (options of config) {
    await make(options)
  }
})()
