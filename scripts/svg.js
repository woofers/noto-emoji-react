const data = require('../data/emoji')
const svgr = require('@svgr/core').default
const fs = require('fs')
const path = require('path')
const raw = path.join(__dirname, '../noto/svg')
const cli = require('child_process')
const util = require('util')
const exec = util.promisify(cli.exec)
const config = require('../config')
const mkdir = require('mkdirp')
const toReactFromPng = require('./template')

const img = postfix => path.join(__dirname, `../noto/svg-${postfix}`)

const ext = (file, options) => options && options.name === 'svg' ? file : file.replace('.svg', '.png')

const out = name => path.join(__dirname, `../lib/${name}`)

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

const writeFile = async (pathname, content) => {
  await mkdir(path.dirname(pathname))
  fs.writeFile(pathname, content, (err) => {
    if (err) {
      console.log(`Could not write ${pathname}`, err)
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
  await mkdir(baked)
  const isVector = name === 'svg'
  for (const emoji of (isVector ? fonts : Object.values(emojis).map(el => el.file))) {
    const options = (() => {
      if (isVector) return `--export-text-to-path --export-plain-svg=${baked}/${emoji}`
      return `-w ${size} -h ${size} --export-png=${baked}/${ext(emoji)} `
    })()
    const out = await inkscape(`${raw}/${emoji} ${options}`)
  }
}

const toReactFromSvg = (data, name) => {
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
  return svgr(data, config, { componentName: name })
}

const toReactComponent = isVector => isVector ? toReactFromSvg : toReactFromPng

const toReact = options => {
  const baked = img(options.name)
  const isVector = options.name === 'svg'
  const svg = isVector ? raw : baked
  let index = ''
  for (const emoji of Object.values(emojis)) {
    const { name, file } = emoji
    const data = fs.readFileSync(`${fonts.includes(file) ? baked : svg}/${ext(file, options)}`, isVector ? 'utf8' : null)
    toReactComponent(isVector)(data, name).then(async code => {
      await writeFile(`${out(options.name)}/${name}.js`, code)
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
