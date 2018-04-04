import { ProcessOptions, LazyResult } from 'postcss'
import postcss = require('postcss')
import trimPlugin from './stylePlugins/trim'
import scopedPlugin from './stylePlugins/scoped'
import { processors, StylePreprocessor, StylePreprocessorResults } from './styleProcessors'

export interface StyleCompileOptions {
  source: string
  filename: string
  id: string
  map?: any
  scoped?: boolean
  trim?: boolean
  preprocessLang?: string
  preprocessOptions?: any
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
    filename,
    id,
    scoped = true,
    trim = true,
    preprocessLang
  } = options
  const preprocessor = preprocessLang && processors[preprocessLang]
  const preProcessedSource = preprocessor && preprocess(options, preprocessor)
  const map = preProcessedSource ? preProcessedSource.map : options.map
  const source = preProcessedSource ? preProcessedSource.code : options.source

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

function preprocess(
  options: StyleCompileOptions,
  preprocessor: StylePreprocessor
): StylePreprocessorResults {
  return preprocessor.render(options.source, options.map, Object.assign({
    filename: options.filename
  }, options.preprocessOptions))
}
