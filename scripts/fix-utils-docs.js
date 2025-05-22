const fs = require('fs')
const path = require('path')
const fse = require('fs-extra')

const ROOT = path.join(__dirname, '..', 'bee-js-docs', 'docs', 'api')
const SOURCE = path.join(ROOT, '@ethersphere', 'namespaces', 'Utils')
const DEST = path.join(ROOT, 'namespaces', 'Utils')
const topReadmePath = path.join(ROOT, 'README.md')
const overviewPath = path.join(ROOT, 'Overview.md')

fse.ensureDirSync(DEST)

let functionFiles = []

const functionDir = path.join(SOURCE, 'functions')
if (fs.existsSync(functionDir)) {
  const files = fs.readdirSync(functionDir)
  for (const file of files) {
    const src = path.join(functionDir, file)
    const dest = path.join(DEST, file)

    let content = fs.readFileSync(src, 'utf-8')

    content = content
      .replace(/\(\.\.\/\.\.\/\.\.\/\.\.\/README\.md\)/g, '')
      .replace(/\(\.\.\/\.\.\/\.\.\/\.\.\/classes\/(.*?)\.md\)/g, '(../../classes/$1.md)')
      .replace(/\(\.\.\/\.\.\/\.\.\/\.\.\/enumerations\/(.*?)\.md\)/g, '(../../enumerations/$1.md)')
      .replace(/\(\.\.\/\.\.\/\.\.\/\.\.\/type-aliases\/(.*?)\.md\)/g, '(../../type-aliases/$1.md)')
      .replace(/\(\.\.\/\.\.\/\.\.\/\.\.\/interfaces\/(.*?)\.md\)/g, '(../../interfaces/$1.md)')
      .replace(/\(\.\.\/\.\.\/\.\.\/\.\.\/functions\/(.*?)\.md\)/g, '(../../functions/$1.md)')
      .replace(/\(\.\.\/\.\.\/\.\.\/\.\.\/variables\/(.*?)\.md\)/g, '(../../variables/$1.md)')
      .replace(/\(\.\.\/README\.md\)/g, '')
      .replace(/\(@ethersphere\/[^\)]+\)/g, '')

    // Remove first two lines (safe because function docs don’t use frontmatter)
    content = content.split('\n').slice(2).join('\n')

    fs.writeFileSync(dest, content, 'utf-8')
    functionFiles.push(file.replace(/\.md$/, ''))
    console.log(`✅ Moved and cleaned ${file}`)
  }
}

const readmePath = path.join(SOURCE, 'README.md')
if (fs.existsSync(readmePath)) {
  fs.unlinkSync(readmePath)
  console.log('🗑️ Removed nested Utils README.md')
}

const nestedRoot = path.join(ROOT, '@ethersphere')
fse.removeSync(nestedRoot)
console.log('🧹 Removed @ethersphere directory')

if (fs.existsSync(topReadmePath)) {
  let readmeContent = fs.readFileSync(topReadmePath, 'utf-8')

  const firstFunction = functionFiles.sort()[0]
  readmeContent = readmeContent.replace(
    /\[Utils\]\(@ethersphere\/namespaces\/Utils\/README\.md\)/g,
    `[Utils](/docs/api/namespaces/Utils/${firstFunction})`
  )

  readmeContent = readmeContent
    .replace(/\(README\.md\)/g, '(Overview.md)')
    .replace(/\.\.\/README\.md/g, '../Overview.md')
    .replace(/\.\.\/\.\.\/README\.md/g, '../../Overview.md')

  const frontmatter = `---\nid: Overview\ntitle: API Reference\nslug: /api/\nsidebar_position: 0\n---\n\n`
  if (!readmeContent.startsWith('---')) {
    readmeContent = frontmatter + readmeContent
  }

  fs.writeFileSync(overviewPath, readmeContent, 'utf-8')
  fs.unlinkSync(topReadmePath)
  console.log('📝 Renamed README.md to Overview.md, added frontmatter, and fixed links')

  // Remove breadcrumb from Overview.md after frontmatter
  let fullContent = fs.readFileSync(overviewPath, 'utf-8')
  const frontmatterMatch = fullContent.match(/^---\n[\s\S]+?\n---\n+/)
  if (frontmatterMatch) {
    const front = frontmatterMatch[0]
    let body = fullContent.slice(front.length)
    body = body.replace(
      /^\*\*@ethersphere\/bee-js\*\*[\r\n]+\*\*\*[\r\n]+# @ethersphere\/bee-js[\r\n]*/m,
      ''
    )
    fs.writeFileSync(overviewPath, front + body, 'utf-8')
    console.log('🧼 Cleaned breadcrumb from Overview.md without removing frontmatter')
  }
}

const strayUtilsPath = path.join(DEST, 'Utils.md')
if (fs.existsSync(strayUtilsPath)) {
  fs.unlinkSync(strayUtilsPath)
  console.log('🗑️ Removed stray namespaces/Utils/Utils.md')
}

function recursivelyFixReadmeLinks(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      recursivelyFixReadmeLinks(fullPath)
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      let content = fs.readFileSync(fullPath, 'utf-8')

      content = content.replace(/\(\.\.\/README\.md\)/g, '(../Overview.md)')

      content = content.replace(
        /^\[\*\*@ethersphere\/bee-js\*\*\](?:\(.*?\))?[\r\n]+\*\*\*[\r\n]+\[@ethersphere\/bee-js\](?:\(.*?\))?(?: \/ \[.*?\])?(?: \/ .*?)?\n?/m,
        ''
      )

      // Remove first two lines if NOT a file with frontmatter
      if (!content.startsWith('---')) {
        content = content.split('\n').slice(2).join('\n')
      }

      fs.writeFileSync(fullPath, content, 'utf-8')
      console.log(`🧼 Cleaned ${entry.name}`)
    }
  }
}

recursivelyFixReadmeLinks(ROOT)
