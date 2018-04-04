import merge from 'merge-source-map'

export interface StylePreprocessor {
  render(
    source: string,
    map: any | null,
    options: any
  ): StylePreprocessorResults
}

export interface StylePreprocessorResults {
  code: string
  map?: any
}

// .scss/.sass processor
const scss: StylePreprocessor = {
  render(
    source: string,
    map: any | null,
    options: any
  ): StylePreprocessorResults {
    const nodeSass = require('node-sass')
    const finalOptions = Object.assign({}, options, {
      data: source,
      file: options.filename,
      sourceMap: !!map
    })

    const result = nodeSass.renderSync(finalOptions)

    if (map) {
      return {
        code: result.css.toString(),
        map: merge(map, JSON.parse(result.map.toString()))
      }
    }

    return { code: result.css.toString() }
  }
}

const sass = {
  render(
    source: string,
    map: any | null,
    options: any
  ): StylePreprocessorResults {
    return scss.render(
      source,
      map,
      Object.assign({}, options, { indentedSyntax: true })
    )
  }
}

export const processors: { [key: string]: StylePreprocessor } = {
  scss,
  sass
}
