import merge from "merge-source-map";

export interface StylePreprocessor {
  render(
    source: string,
    map: any | null,
    options: any
  ): StylePreprocessorResults;
}

export interface StylePreprocessorResults {
  source: string;
  map?: any;
}

// .scss/.sass processor
let nodeSass: any;
const scss: StylePreprocessor = {
  render(
    source: string,
    map: any | null,
    options: any
  ): StylePreprocessorResults {
    if (!nodeSass) nodeSass = require("node-sass");

    const finalOptions = Object.assign({}, options, {
      data: source,
      file: options.filename,
      sourceMap: !!map
    });

    const result = nodeSass.renderSync(finalOptions);

    if (map) {
      return {
        source: result.css.toString(),
        map: merge(map, JSON.parse(result.map.toString()))
      };
    }

    return { source: result.css.toString() };
  }
};

const sass = {
  render(
    source: string,
    map: any | null,
    options: any
  ): StylePreprocessorResults {
    return scss.render(source, map, Object.assign({}, options, { indentedSyntax: true }))
  }
}

export const processors: { [key: string]: StylePreprocessor } = {
  scss,
  sass
};
