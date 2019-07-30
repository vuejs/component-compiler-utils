# @vue/component-compiler-utils [![Build Status](https://circleci.com/gh/vuejs/component-compiler-utils/tree/master.svg?style=shield)](https://circleci.com/gh/vuejs/component-compiler-utils/)

> 用于编译 Vue 单文件组件的底层工具。

此 package 包含偏底层的实用工具，以下场景可能需要用到它：为构建工具编写 plugin / transform 或者将 Vue 的单文件组件编译为 JavaScript 的模块系统。它被用于 [vue-loader](https://github.com/vuejs/vue-loader) v15 及更高版本。

API 设计为原子级 —— 目的是尽可能保证其可复用性，同时也保证其灵活性。

## 为什么不是 `vue-template-compiler` 的平行依赖？

由于此 package 更多被用于底层实用工具，所以它通常是实际 Vue 项目中的可传递依赖。因此，当在调用 `parse` 和 `compileTemplate` 方法时，依赖它的上层 package（如 `vue-loader`）负责通过 option 注入 `vue-template-compiler`。

未将其列为平行依赖是为了让工具的使用者可以使用非 `vue-template-compiler` 的模板编译器，而无需将 `vue-template-compiler` 引入，只需满足此工具的依赖即可。

## API

### parse(ParseOptions): SFCDescriptor

使用 source map 将单文件组件源解析为 descriptor。必须通过 `complier` 选项传入当前编译器（`vue-template-compiler`），以便用户可以确定使用的特性版本。

``` ts
interface ParseOptions {
  source: string
  filename?: string
  compiler: VueTemplateCompiler
  // https://github.com/vuejs/vue/tree/dev/packages/vue-template-compiler#compilerparsecomponentfile-options
  // default: { pad: 'line' }
  compilerParseOptions?: VueTemplateCompilerParseOptions
  sourceRoot?: string
  needMap?: boolean
}

interface SFCDescriptor {
  template: SFCBlock | null
  script: SFCBlock | null
  styles: SFCBlock[]
  customBlocks: SFCCustomBlock[]
}

interface SFCCustomBlock {
  type: string
  content: string
  attrs: { [key: string]: string | true }
  start: number
  end: number
  map?: RawSourceMap
}

interface SFCBlock extends SFCCustomBlock {
  lang?: string
  src?: string
  scoped?: boolean
  module?: string | boolean
}
```

### compileTemplate(TemplateCompileOptions): TemplateCompileResults

获取原始模板并将其转换为 JavaScript 代码。必须通过 `complier` 选项传入当前编译器（`vue-template-compiler`），以便用户可以确定使用的特性版本。

它还可以对 [consolidate](https://github.com/tj/consolidate.js/) 支持的任何模板引擎执行预处理。

``` ts
interface TemplateCompileOptions {
  source: string
  filename: string

  compiler: VueTemplateCompiler
  // https://github.com/vuejs/vue/tree/dev/packages/vue-template-compiler#compilercompiletemplate-options
  // default: {}
  compilerOptions?: VueTemplateCompilerOptions

  // 模板预处理器
  preprocessLang?: string
  preprocessOptions?: any

  // 将模板中找到的资源 URL 转换为 `require()` 调用
  // 默认情况下，此选项处于关闭状态。如果设置为 true，则默认值为：
  // {
  //   video: ['src', 'poster'],
  //   source: 'src',
  //   img: 'src',
  //   image: ['xlink:href', 'href'],
  //   use: ['xlink:href', 'href']
  // }
  transformAssetUrls?: AssetURLOptions | boolean

  // 对于 vue-template-es2015-compiler 来说，这是 Buble 的 fork 版本
  transpileOptions?: any

  isProduction?: boolean  // default: false
  isFunctional?: boolean  // default: false
  optimizeSSR?: boolean   // default: false

  // 是否美化编译的 render 函数（仅限开发环境）
  // default: true
  prettify?: boolean
}

interface TemplateCompileResult {
  code: string
  source: string
  tips: string[]
  errors: string[]
}

interface AssetURLOptions {
  [name: string]: string | string[]
}
```

#### 处理输出

生成的 javascript 代码如下所示：

``` js
var render = function (h) { /* ... */}
var staticRenderFns = [function (h) { /* ... */}, function (h) { /* ... */}]
```

它假设不适用任何模块系统。如有需要，你需自行处理。

### compileStyle(StyleCompileOptions)

获取输入的原始 CSS 并进行作用域 CSS 转换。不会处理预处理器。如果组件未使用作用域 CSS，则可以跳过此步骤。

``` ts
interface StyleCompileOptions {
  source: string
  filename: string
  id: string
  map?: any
  scoped?: boolean
  trim?: boolean
  preprocessLang?: string
  preprocessOptions?: any
  postcssOptions?: any
  postcssPlugins?: any[]
}

interface StyleCompileResults {
  code: string
  map: any | void
  rawResult: LazyResult | void // raw lazy result from PostCSS
  errors: string[]
}
```

### compileStyleAsync(StyleCompileOptions)

与 `compileStyle(StyleCompileOptions)` 相似，但它会返回一个解析为 `StyleCompileResults` 的 Promise。它可以与异步的 postcss 插件一起使用。
