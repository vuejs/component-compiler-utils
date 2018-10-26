// vue compiler module for transforming `<tag>:<attribute>` to `require`

import { urlToRequire, ASTNode, Attr } from './utils'

export interface AssetURLOptions {
  [name: string]: string | string[]
}

const defaultOptions: AssetURLOptions = {
  video: ['src', 'poster'],
  source: 'src',
  img: 'src',
  image: ['xlink:href', 'href']
}

export default (userOptions?: AssetURLOptions) => {
  const options = userOptions
    ? Object.assign({}, defaultOptions, userOptions)
    : defaultOptions

  return {
    postTransformNode: (node: ASTNode) => {
      transform(node, options)
    }
  }
}

function transform(node: ASTNode, options: AssetURLOptions) {
  if (node.__assetUrlTransformed) {
    return
  }
  for (const tag in options) {
    if (tag === '*' || node.tag === tag) {
      let attributes = options[tag]
      if (typeof attributes === 'string') {
        attributes = [attributes]
      }
      if (node.staticStyle && attributes.indexOf('style') > -1) {
        node.staticStyle = rewriteStaticStyle(node.staticStyle)
      }
      if (node.attrs) {
        attributes.filter(attr => attr !== 'style').forEach(attrName => {
          node.attrs.some(attr => rewrite(attr, attrName))
        })
      }
    }
  }
  node.__assetUrlTransformed = true
}

function rewrite(attr: Attr, name: string) {
  if (attr.name === name) {
    const value = attr.value
    // only transform static URLs
    if (value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
      attr.value = urlToRequire(value.slice(1, -1))
      return true
    }
  }
  return false
}

function rewriteStaticStyle(style: string): string {
  const styleObj = JSON.parse(style)

  // A marker which won't appear in target string
  let MARKER: string = Math.random()
    .toString(16)
    .slice(2, 10)
  while (style.indexOf(MARKER) !== -1) {
    MARKER = `$${MARKER}$`
  }
  let id = -1
  const expressions: string[] = []

  let result: string = JSON.stringify(styleObj, (key, value) => {
    if (typeof value !== 'string') {
      return value
    }
    let transformed: string = value.replace(
      /url\((['"])?(.*?)\1\)/g,
      (_0, _1, url) => {
        // outer quotes would be added later
        return `url(' + ${urlToRequire(url)} + ')`
      }
    )
    if (transformed !== value) {
      // add outer quotes
      transformed = `'${transformed}'`
      expressions.push(transformed)
      id++
      return MARKER + id
    }
    return value
  })
  const MARKER_RE = new RegExp(`"${MARKER}(\\d+)"`, 'g')
  result = result.replace(MARKER_RE, (_, id) => expressions[id])
  return result
}
