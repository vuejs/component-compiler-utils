import { parse } from '../lib/parse'
import { compileTemplate } from '../lib/compileTemplate'
import * as compiler from 'vue-template-compiler'

test('should work', () => {
  const source = `<div><p>{{ render }}</p></div>`

  const result = compileTemplate({
    filename: 'example.vue',
    source,
    compiler: compiler
  })

  expect(result.errors.length).toBe(0)
  expect(result.source).toBe(source)
  // should expose render fns
  expect(result.code).toMatch(`var render = function`)
  expect(result.code).toMatch(`var staticRenderFns = []`)
  // should mark with stripped
  expect(result.code).toMatch(`render._withStripped = true`)
  // should prefix bindings
  expect(result.code).toMatch(`_vm.render`)
})

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

/**
 * vuejs/component-compiler-utils#22 Support uri fragment in transformed require
 */
test('supports uri fragment in transformed require', () => {
  const source = //
  '<svg>\
    <use href="~@svg/file.svg#fragment"></use>\
  </svg>'
  const result = compileTemplate({
    filename: 'svgparticle.html',
    source: source,
    transformAssetUrls: {
      "use": "href"
    },
    compiler: compiler
  })
  expect(result.errors.length).toBe(0)
  expect(result.code).toMatch(/href: require\("@svg\/file.svg"\) \+ "#fragment"/)
})

/**
 * vuejs/component-compiler-utils#22 Support uri fragment in transformed require
 */
test('when too short uri then empty require', () => {
  const source = //
  '<svg>\
    <use href="~"></use>\
  </svg>'
  const result = compileTemplate({
    filename: 'svgparticle.html',
    source: source,
    transformAssetUrls: {
      "use": "href"
    },
    compiler: compiler
  })
  expect(result.errors.length).toBe(0)
  expect(result.code).toMatch(/href: require\(""\)/)
})

test('warn missing preprocessor', () => {
  const template = parse({
    source: '<template lang="unknownLang">\n' + '</template>\n',
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
