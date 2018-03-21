import {
  VueTemplateCompiler,
  VueTemplateCompilerOptions
} from './types'

import assetUrlsModule, { AssetURLOptions } from './templateCompilerModules/assetUrl'
import srcsetModule from './templateCompilerModules/srcset'

const prettier = require('prettier')
const consolidate = require('consolidate')
const transpile = require('vue-template-es2015-compiler')

export interface TemplateCompileOptions {
  source: string
  filename: string
  compiler: VueTemplateCompiler
  compilerOptions?: VueTemplateCompilerOptions
  transformAssetUrls?: AssetURLOptions | boolean
  preprocessLang?: string
  preprocessOptions?: any
  transpileOptions?: any
  isProduction?: boolean
  isFunctional?: boolean
  optimizeSSR?: boolean
}

export interface TemplateCompileResult {
  code: string
  source: string
  tips: string[]
  errors: string[]
}

export function compileTemplate (
  options: TemplateCompileOptions
): TemplateCompileResult {
  const { preprocessLang } = options
  const preprocessor = preprocessLang && consolidate[preprocessLang]
  if (preprocessor) {
    return actuallyCompile(Object.assign({}, options, {
      source: preprocess(options, preprocessor)
    }))
  } else {
    return actuallyCompile(options)
  }
}

function preprocess (
  options: TemplateCompileOptions,
  preprocessor: any
): string {
  const {
    source,
    filename,
    preprocessOptions
  } = options

  const finalPreprocessOptions = Object.assign({
    filename
  }, preprocessOptions)

  // Consolidate exposes a callback based API, but the callback is in fact
  // called synchronously for most templating engines. In our case, we have to
  // expose a synchronous API so that it is usable in Jest transforms (which
  // have to be sync because they are applied via Node.js require hooks)
  let res: any, err
  preprocessor.render(
    source,
    finalPreprocessOptions,
    (_err: Error | null, _res: string) => {
      if (_err) err = _err
      res = _res
    }
  )

  if (err) throw err
  return res
}

function actuallyCompile (
  options: TemplateCompileOptions
): TemplateCompileResult {
  const {
    source,
    compiler,
    compilerOptions = {},
    transpileOptions = {},
    transformAssetUrls,
    isProduction = process.env.NODE_ENV === 'production',
    isFunctional = false,
    optimizeSSR = false
  } = options

  const compile = optimizeSSR && compiler.ssrCompile
    ? compiler.ssrCompile
    : compiler.compile

  let finalCompilerOptions = compilerOptions
  if (transformAssetUrls) {
    const builtInModules = [
      transformAssetUrls === true
        ? assetUrlsModule()
        : assetUrlsModule(transformAssetUrls),
      srcsetModule()
    ]
    finalCompilerOptions = Object.assign({}, compilerOptions, {
      modules: [...builtInModules, ...compilerOptions.modules || []]
    })
  }

  const {
    render,
    staticRenderFns,
    tips,
    errors
  } = compile(source, finalCompilerOptions)

  if (errors && errors.length) {
    return {
      code: (
        `var render = function () {}\n` +
        `var staticRenderFns = []\n`
      ),
      source,
      tips,
      errors
    }
  } else {
    const finalTranspileOptions = Object.assign({}, transpileOptions, {
      transforms: Object.assign({}, transpileOptions.transforms, {
        stripWithFunctional: isFunctional
      })
    })

    const toFunction = (code: string): string => {
      return `function (${isFunctional ? `_h,_vm` : ``}) {${code}}`
    }

    // transpile code with vue-template-es2015-compiler, which is a forked
    // version of Buble that applies ES2015 transforms + stripping `with` usage
    let code = transpile(
      `var render = ${toFunction(render)}\n` +
      `var staticRenderFns = [${staticRenderFns.map(toFunction)}]`,
      finalTranspileOptions
    ) + `\n`

    if (!isProduction) {
      // mark with stripped (this enables Vue to use correct runtime proxy
      // detection)
      code += `render._withStripped = true`
      code = prettier.format(code, { semi: false })
    }

    return {
      code,
      source,
      tips,
      errors
    }
  }
}
