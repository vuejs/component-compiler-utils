import { parse } from '../lib/parse'
import { compileTemplate } from '../lib/compileTemplate'
import * as compiler from 'vue-template-compiler'

test('preprocess pug', () => {
  const template = parse({
    source:
      '<template lang="pug">\n' +
      'body\n' +
      ' h1 Pug Examples\n' +
      ' div.container\n' +
      '   p Cool Pug example!\n' +
      '</template>\n',
    compiler,
    filename: 'example.vue',
    needMap: true
  }).template

  const result = compileTemplate({
    filename: 'example.vue',
    source: template.content,
    preprocessLang: template.lang,
    compiler: compiler
  })

  expect(result.errors.length).toBe(0)
})

test('warn missing preprocessor', () => {
  const template = parse({
    source:
      '<template lang="unknownLang">\n' +
      '</template>\n',
    compiler,
    filename: 'example.vue',
    needMap: true
  }).template

  const result = compileTemplate({
    filename: 'example.vue',
    source: template.content,
    preprocessLang: template.lang,
    compiler: compiler
  })

  expect(result.errors.length).toBe(1)
})
