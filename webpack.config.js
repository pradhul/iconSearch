const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  entry: './src/index.ts', // Entry point of your Lambda function
  target: 'node',          // Target Node.js environment
  mode: 'production',     // Optimize for production
  devtool: 'source-map', // Generate source maps for easier debugging
  externals: {
    // You can mark AWS SDK as external if you don't want to bundle it
    // (Lambda provides it in the runtime, but it can increase your package size if bundled)
    'aws-sdk': 'aws-sdk', 
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/, // Handle .ts and .tsx files
        use: 'ts-loader', // Use ts-loader to transpile TypeScript
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'], // Resolve these extensions
  },
  output: {
    filename: 'index.js',      // Output file name (Lambda expects index.js or you can configure it)
    path: path.resolve(__dirname, 'dist'), // Output directory
    libraryTarget: 'commonjs2', // Important: use CommonJS format for Lambda
    clean: true, // this will clean the dist folder before building
  },
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin()], // Minify the output code
  },
};