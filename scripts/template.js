function defaultTemplate(
  { template },
  opts,
  { imports, interfaces, componentName, props, jsx, exports },
) {
  const plugins = ['jsx']
  if (opts.typescript) {
    plugins.push('typescript')
  }
  const typeScriptTpl = template.smart({ plugins })
  return typeScriptTpl.ast`
${interfaces}
module.exports.${componentName} = function (${props}) {
  return ${jsx}
}
module.exports.${componentName.name} = '${componentName.name}'
`
}

module.exports = defaultTemplate
