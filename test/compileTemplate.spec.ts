import { parse } from '../lib/parse'
import { compileTemplate } from '../lib/compileTemplate'
import * as compiler from 'vue-template-compiler'

import Vue from 'vue'

afterEach(() => jest.resetAllMocks().resetModules())

function mockRender(code, options = {}) {
  eval(
    `${code}; options.render = render; options.staticRenderFns = staticRenderFns`
  )
  const vm = new Vue(Object.assign({}, options))
  vm.$mount()
  return vm._vnode
}

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
      use: 'href'
    },
    compiler: compiler
  })
  expect(result.errors.length).toBe(0)
  expect(result.code).toMatch(
    /href: require\("@svg\/file.svg"\) \+ "#fragment"/
  )
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
      use: 'href'
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

test('transform assetUrls', () => {
  const source = `
<div>
  <img src="./logo.png">
  <img src="~fixtures/logo.png">
  <img src="~/fixtures/logo.png">
</div>
`
  const result = compileTemplate({
    compiler: compiler,
    filename: 'example.vue',
    source,
    transformAssetUrls: true
  })
  expect(result.errors.length).toBe(0)

  jest.mock('./logo.png', () => 'a', { virtual: true })
  jest.mock('fixtures/logo.png', () => 'b', { virtual: true })

  const vnode = mockRender(result.code)
  expect(vnode.children[0].data.attrs.src).toBe('a')
  expect(vnode.children[2].data.attrs.src).toBe('b')
  expect(vnode.children[4].data.attrs.src).toBe('b')
})

test('transform srcset', () => {
  // TODO:
  const source = `
<div>
  <img src="./logo.png">
  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink= "http://www.w3.org/1999/xlink">
    <image xlink:href="./logo.png" />
  </svg>
  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink= "http://www.w3.org/1999/xlink">
    <use xlink:href="./logo.png"/>
  </svg>
  </svg>
  <img src="./logo.png" srcset="./logo.png">
  <img src="./logo.png" srcset="./logo.png 2x">
  <img src="./logo.png" srcset="./logo.png, ./logo.png 2x">
  <img src="./logo.png" srcset="./logo.png 2x, ./logo.png">
  <img src="./logo.png" srcset="./logo.png 2x, ./logo.png 3x">
  <img src="./logo.png" srcset="./logo.png, ./logo.png 2x, ./logo.png 3x">
  <img
    src="./logo.png"
    srcset="
      ./logo.png 2x,
      ./logo.png 3x
  ">
</div>
`
  const result = compileTemplate({
    compiler: compiler,
    filename: 'example.vue',
    source,
    transformAssetUrls: true
  })
  expect(result.errors.length).toBe(0)

  jest.mock('./logo.png', () => 'test-url', { virtual: true })
  const vnode = mockRender(result.code)

  // img tag
  expect(vnode.children[0].data.attrs.src).toBe('test-url')
  // image tag (SVG)
  expect(vnode.children[2].children[0].data.attrs['xlink:href']).toBe(
    'test-url'
  )
  // use tag (SVG)
  expect(vnode.children[4].children[0].data.attrs['xlink:href']).toBe(
    'test-url'
  )

  // image tag with srcset
  expect(vnode.children[6].data.attrs.srcset).toBe('test-url')
  expect(vnode.children[8].data.attrs.srcset).toBe('test-url 2x')
  // image tag with multiline srcset
  expect(vnode.children[10].data.attrs.srcset).toBe('test-url, test-url 2x')
  expect(vnode.children[12].data.attrs.srcset).toBe('test-url 2x, test-url')
  expect(vnode.children[14].data.attrs.srcset).toBe('test-url 2x, test-url 3x')
  expect(vnode.children[16].data.attrs.srcset).toBe(
    'test-url, test-url 2x, test-url 3x'
  )
  expect(vnode.children[18].data.attrs.srcset).toBe('test-url 2x, test-url 3x')
})
