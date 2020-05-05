function defaultTemplate(
  { template },
  opts,
  { imports, interfaces, componentName, props, jsx, exports },
) {
  const plugins = ['jsx']
  const typeScriptTpl = template.smart({ plugins })
  return typeScriptTpl.ast`
module.exports.${componentName} = function (${props}) {
  return ${jsx}
}
module.exports.${componentName.name}.displayName = '${componentName.name}'
`
}

module.exports = defaultTemplate
