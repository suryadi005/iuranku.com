const mongoose = require('mongoose')
const path = require('path')
const fs = require('fs');
const fsX = require('fs-extra');

const srcAssetDir = path.join(process.cwd(), 'assets');
const publicDir = path.join(process.cwd(), 'public/assets');
const hash = mongoose.Types.ObjectId()

function getAssetFilePaths () {
  const files = []
  const toCheckPaths = [srcAssetDir]
  
  while (toCheckPaths.length > 0) {
    const toCheckPath = toCheckPaths.pop()
    const toCheckPathContents = fs.readdirSync(toCheckPath)
    for (let item of toCheckPathContents) {
      const itemPath = toCheckPath + '/' + item
      const stats = fs.statSync(itemPath);
      if (stats.isDirectory()) {
        toCheckPaths.push(itemPath)
      } else {
        files.push(itemPath)
      }
    }
  }

  return files
}

function copyAssets () {
  const originalFilePaths = getAssetFilePaths()
  const targetFilePaths = originalFilePaths.map((filePath) => {
    filePath = filePath.replace(srcAssetDir, publicDir)
    const splitedByDot = filePath.split('.')
    if (splitedByDot.length > 1) {
      splitedByDot[splitedByDot.length - 1] = hash + '.' + splitedByDot[splitedByDot.length - 1]
      return splitedByDot.join('.')
    } else {
      const splitedBySlash = filePath.split('/')
      console.log(splitedBySlash)
      splitedBySlash[splitedBySlash.length - 1] = splitedBySlash[splitedBySlash.length - 1] + '.' +  hash
      return splitedBySlash.join('/')
    }
  })
  
  for (let i = 0; i < originalFilePaths.length; i ++) {
    fsX.copySync(originalFilePaths[i], targetFilePaths[i])
  }

  return {
    originalFilePaths,
    targetFilePaths
  }
}

function buildManifest ({
  originalFilePaths,
  targetFilePaths
}) {
  const manifest = {}
  for (let i = 0; i < originalFilePaths.length; i ++) {
    manifest[originalFilePaths[i].replace(srcAssetDir, '')] = targetFilePaths[i].replace(publicDir, '/assets')
  }
  return manifest
}

function main () {
  const { originalFilePaths, targetFilePaths } = copyAssets()
  const manifest = buildManifest({ originalFilePaths, targetFilePaths })
  fs.writeFileSync(path.join(__dirname, 'manifest.js'), `module.exports = ${JSON.stringify(manifest, null, 2)}\n`)
}

main ()
