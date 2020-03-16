import fs from 'fs'
import path from 'path'

import { Notion, NotionRule } from '../Notion'

describe('Test Notion', () => {
  it('should modify html based on rules', () => {
    const html = fs.readFileSync(path.join(__dirname, './fixture.html'), 'utf8')
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
      {
        type: 'update',
        operation: {
          element: 'title',
          args: {
            innerHTML: value => {
              return `ZEBRA ` + value
            },
          },
        },
      },
    ]
    const notion = new Notion(rules)
    expect(notion.modifyHTML(html)).toMatchSnapshot()
  })
})
