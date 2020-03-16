import fs from 'fs'
import path from 'path'

import glob from 'glob'
import arg from 'arg'

import { Notion, NotionRule } from './Notion'

async function main() {
  console.log('Running n...')
  const args = arg({
    '--dir': String,
  })

  const dir = args['--dir']
  const dirPath = path.join(process.cwd(), dir)

  if (!fs.existsSync(dirPath)) {
    console.error(`The path ${dirPath} does not exist`)
  }

  const files = glob.sync(`${dirPath}/**/*.html`, {
    ignore: 'node_modules/**',
  }) //?
  const rules: NotionRule[] = [
    {
      type: 'delete',
      operation: {
        selectorAll: 'style',
      },
    },
    {
      type: 'delete',
      operation: {
        selectorAll: 'link',
      },
    },
    {
      type: 'create',
      operation: {
        element: 'link',
        siblingOf: 'title',
        args: {
          href: '/style.css',
          rel: 'stylesheet',
          type: 'text/css',
        },
      },
    },
  ]
  const notion = new Notion(rules)
  files.forEach(filePath => {
    console.log(`Working on file ${filePath}`)
    const fileContent = fs.readFileSync(filePath, 'utf8')
    const newContent = notion.modifyHTML(fileContent) //?
    fs.writeFileSync(filePath, newContent)
  })
}

if (require.main === module) {
  main()
}
