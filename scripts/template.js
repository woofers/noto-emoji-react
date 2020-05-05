
const template = esm => {
  return ({ template }, opts,
          { imports, interfaces, componentName, props, jsx, exports }) => {
    const plugins = ['jsx']
    const typeScriptTpl = template.smart({ plugins })
    if (esm) {
      return typeScriptTpl.ast`
export var ${componentName} = function (${props}) {
  return ${jsx}
}
${componentName.name}.displayName = '${componentName.name}'
`
    }
    return typeScriptTpl.ast`
module.exports.${componentName} = function (${props}) {
  return ${jsx}
}
module.exports.${componentName.name}.displayName = '${componentName.name}'
`
  }
}

module.exports = template
