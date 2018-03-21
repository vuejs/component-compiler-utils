import { ProcessOptions, LazyResult } from 'postcss'
import postcss = require('postcss')
import trimPlugin from './stylePlugins/trim'
import scopedPlugin from './stylePlugins/scoped'

export interface StyleCompileOptions {
  source: string
  filename: string
  id: string
  map?: any
  scoped?: boolean
  trim?: boolean
}

export interface StyleCompileResults {
  code: string
  map: any | void
  rawResult: LazyResult | void
  errors: string[]
}

export function compileStyle (
  options: StyleCompileOptions
): StyleCompileResults {
  const {
    source,
    filename,
    id,
    map,
    scoped = true,
    trim = true
  } = options

  const plugins = []
  if (trim) {
    plugins.push(trimPlugin())
  }
  if (scoped) {
    plugins.push(scopedPlugin(id))
  }

  const postCSSOptions: ProcessOptions = {
    to: filename,
    from: filename
  }
  if (map) {
    postCSSOptions.map = {
      inline: false,
      annotation: false,
      prev: map
    }
  }

  let result, code, outMap
  const errors = []
  try {
    result = postcss(plugins).process(source, postCSSOptions)
    // force synchronous transform (we know we only have sync plugins)
    code = result.css
    outMap = result.map
  } catch (e) {
    errors.push(e)
  }

  return {
    code: code || ``,
    map: outMap && outMap.toJSON(),
    errors,
    rawResult: result
  }
}
