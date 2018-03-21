import {
  parse,
  SFCBlock,
  SFCCustomBlock,
  SFCDescriptor
} from './parse'

import {
  compileTemplate,
  TemplateCompileOptions,
  TemplateCompileResult
} from './compileTemplate'

import {
  compileStyle,
  StyleCompileOptions,
  StyleCompileResults
} from './compileStyle'

// API
export {
  parse,
  compileTemplate,
  compileStyle
}

// types
export {
  SFCBlock,
  SFCCustomBlock,
  SFCDescriptor,
  TemplateCompileOptions,
  TemplateCompileResult,
  StyleCompileOptions,
  StyleCompileResults
}
