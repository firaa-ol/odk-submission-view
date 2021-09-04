const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  entry: './enketo-view.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'public/scripts/dist'),
    libraryTarget: 'var',
    library: 'EntryPoint'
  },
  optimization: {
    minimize: true,
    minimizer: [
        new TerserPlugin({
            terserOptions: {
                keep_classnames: true,
                keep_fnames: true
            }
          })
        ]
  },
};