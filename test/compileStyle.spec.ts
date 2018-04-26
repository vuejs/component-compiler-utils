import { parse } from '../lib/parse'
import { compileStyle } from '../lib/compileStyle'

test('preprocess less', () => {
  const style = parse({
    source:
      '<style lang="less">\n' +
      '@red: rgb(255, 0, 0);\n' +
      '.color { color: @red; }\n' +
      '</style>\n',
    filename: 'example.vue',
    needMap: true
  }).styles[0]
  const result = compileStyle({
    id: 'v-scope-xxx',
    filename: 'example.vue',
    source: style.content,
    map: style.map,
    scoped: false,
    preprocessLang: style.lang
  })

  expect(result.errors.length).toBe(0)
  expect(result.code).toEqual(expect.stringContaining('color: #ff0000;'))
  expect(result.map).toBeTruthy()
})

test('preprocess scss', () => {
  const style = parse({
    source:
      '<style lang="scss">\n' +
      '$red: rgb(255, 0, 0);\n' +
      '.color { color: $red; }\n' +
      '</style>\n',
    filename: 'example.vue',
    needMap: true
  }).styles[0]
  const result = compileStyle({
    id: 'v-scope-xxx',
    filename: 'example.vue',
    source: style.content,
    map: style.map,
    scoped: false,
    preprocessLang: style.lang
  })

  expect(result.errors.length).toBe(0)
  expect(result.code).toEqual(expect.stringContaining('color: red;'))
  expect(result.map).toBeTruthy()
})

test('preprocess sass', () => {
  const style = parse({
    source:
      '<style lang="sass">\n' +
      '$red: rgb(255, 0, 0);\n' +
      '.color\n' +
      '   color: $red\n' +
      '</style>\n',
    filename: 'example.vue',
    needMap: true
  }).styles[0]
  const result = compileStyle({
    id: 'v-scope-xxx',
    filename: 'example.vue',
    source: style.content,
    map: style.map,
    scoped: false,
    preprocessLang: style.lang
  })

  expect(result.errors.length).toBe(0)
  expect(result.code).toEqual(expect.stringContaining('color: red;'))
  expect(result.map).toBeTruthy()
})

test('preprocess stylus', () => {
  const style = parse({
    source:
      '<style lang="styl">\n' +
      'red-color = rgb(255, 0, 0);\n' +
      '.color\n' +
      '   color: red-color\n' +
      '</style>\n',
    filename: 'example.vue',
    needMap: true
  }).styles[0]
  const result = compileStyle({
    id: 'v-scope-xxx',
    filename: 'example.vue',
    source: style.content,
    map: style.map,
    scoped: false,
    preprocessLang: style.lang
  })

  expect(result.errors.length).toBe(0)
  expect(result.code).toEqual(expect.stringContaining('color: #f00;'))
  expect(result.map).toBeTruthy()
})

test('custom postcss plugin', () => {
  const spy = jest.fn()
  
  compileStyle({
    id: 'v-scope-xxx',
    filename: 'example.vue',
    source: '.foo { color: red }',
    scoped: false,
    postcssPlugins: [require('postcss').plugin('test-plugin', () => spy)()]
  })

  expect(spy).toHaveBeenCalled()
})

test('custom postcss options', () => {
  const result = compileStyle({
    id: 'v-scope-xxx',
    filename: 'example.vue',
    source: '.foo { color: red }',
    scoped: false,
    postcssOptions: { random: 'foo' }
  })

  expect((<any>result.rawResult).opts.random).toBe('foo')
})
