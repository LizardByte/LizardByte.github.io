const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  entry: {
    bootstrap: [
      'bootstrap/dist/js/bootstrap.bundle.min.js',
      'bootstrap/dist/css/bootstrap.min.css'
    ],
    fontawesome: '@fortawesome/fontawesome-free/css/all.min.css',
    jquery: 'script-loader!jquery/dist/jquery.min.js',  // this needs script-loader or $ will not be defined globally
    popper: '@popperjs/core/dist/umd/popper.min.js',
  },
  output: {
    filename: 'js/[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'css/[name].bundle.css',
    }),
  ],
};
