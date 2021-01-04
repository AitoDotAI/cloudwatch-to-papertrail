module.exports = {
  target: 'node',
  mode: 'production',
  entry: './src/index.js',
  output: {
    filename: 'cloudwatch-to-papertrail.js'
  },
  node: {
    global: true,
    __filename: false,
    __dirname: false,
  },
};
