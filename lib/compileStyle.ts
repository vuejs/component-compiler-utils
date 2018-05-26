const postcss = require('postcss')
import { ProcessOptions, LazyResult } from 'postcss'
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
  sync?: boolean
  preprocessLang?: string
  preprocessOptions?: any
  postcssOptions?: any
  postcssPlugins?: any[]
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
    preprocessLang,
    postcssOptions,
    postcssPlugins
  } = options
  const preprocessor = preprocessLang && processors[preprocessLang]
  const preProcessedSource = preprocessor && preprocess(options, preprocessor)
  const map = preProcessedSource ? preProcessedSource.map : options.map
  const source = preProcessedSource ? preProcessedSource.code : options.source

  const plugins = (postcssPlugins || []).slice()
  if (trim) {
    plugins.push(trimPlugin())
  }
  if (scoped) {
    plugins.push(scopedPlugin(id))
  }

  const postCSSOptions: ProcessOptions = {
    ...postcssOptions,
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
  const errors: any[] = []
  if (preProcessedSource && preProcessedSource.errors.length) {
    errors.push(...preProcessedSource.errors)
  }
  try {
    result = postcss(plugins).process(source, postCSSOptions)
    // force synchronous transform (we know we only have sync plugins)
    code = result.css
    outMap = result.map
  } catch (e) {
    if (/work with async plugins/i.test(e.message)) {
      if (options.sync !== true) {
        return postcss(plugins)
          .process(source, postCSSOptions)
          .then((result: LazyResult): StyleCompileResults => ({
            code: result.css || '',
            map: result.map && result.map.toJSON(),
            errors,
            rawResult: result
          }))
          .catch((error: Error): StyleCompileResults => ({
            code: '',
            map: undefined,
            errors: [...errors, error.message],
            rawResult: undefined
          }))
      }
    }

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
