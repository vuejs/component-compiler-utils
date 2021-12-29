import { PluginCreator, Rule, AtRule } from 'postcss'

const trim = function({ raws }: Rule | AtRule) {
  if (raws.before) raws.before = '\n'
  if (raws.after) raws.after = '\n'
}

const pluginFn: PluginCreator<void> = () => ({
  postcssPlugin: 'trim',
  AtRule: trim,
  Rule: trim
})

pluginFn.postcss = true
export default pluginFn
