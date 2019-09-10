const path = require('path')

/**
 * `electron-packager` options
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-packager.html
 */
module.exports = {
  arch: 'x64',
  // 是否开启asar压缩打包
  // NOTE: 这里有个坑, 开启了asar之后, static内的文件会被压缩到app.asar文件中, 导致修改static内的文件失败
  // 将其关闭, 则不打包到app.asar, 会以app文件夹的形式, 所以能正常修改
  asar: false,
  dir: path.join(__dirname, '../'),
  icon: path.join(__dirname, '../build/icons/icon'),
  ignore: /(^\/(src|test|\.[a-z]+|README|yarn|static|dist\/web))|\.gitkeep/,
  out: path.join(__dirname, '../build'),
  overwrite: true,
  platform: process.env.BUILD_TARGET || 'all'
}
