import { JSDOM } from 'jsdom'
import prettier from 'prettier'

interface NotionRuleDelete {
  selectorAll: string
}

interface NotionRuleCreate {
  element: string
  siblingOf: string
  args: { [key: string]: string }
}

export interface NotionRule {
  type: 'create' | 'read' | 'update' | 'delete'
  operation: NotionRuleCreate | NotionRuleDelete
}

export class Notion {
  _rules: NotionRule[]

  constructor(rules: NotionRule[]) {
    this._rules = rules
  }

  _applyCreate(rule: NotionRule, dom: JSDOM) {
    const operation: NotionRuleCreate = rule.operation as NotionRuleCreate
    const element = dom.window.document.createElement(operation.element)
    Object.entries(operation.args).forEach(([key, value]) => {
      element.setAttribute(key, value)
    })
    const siblineElement = dom.window.document.querySelector(
      operation.siblingOf,
    )
    siblineElement.parentNode.insertBefore(element, siblineElement.nextSibling)
    return dom.serialize()
  }

  _applyDelete(rule: NotionRule, dom: JSDOM) {
    const operation: NotionRuleDelete = rule.operation as NotionRuleDelete
    const elements = dom.window.document.querySelectorAll(operation.selectorAll)
    elements.forEach(element => {
      element.parentNode.removeChild(element)
    })
    return dom.serialize()
  }

  modifyHTML(html: string) {
    let modifyHTML = html

    this._rules.forEach(rule => {
      let dom = new JSDOM(modifyHTML)
      switch (rule.type) {
        case 'create':
          modifyHTML = this._applyCreate(rule, dom)
          break
        case 'delete':
          modifyHTML = this._applyDelete(rule, dom)
          break
        default:
          console.log('warn: unknown rule')
          break
      }
    })
    // const styleElements = Array.from(
    //   dom.window.document.querySelectorAll('style'),
    // )
    // styleElements.forEach(styleElement => {
    //   styleElement.innerHTML = ''
    //   const linkToCSS = dom.window.document.createElement('link')
    //   linkToCSS.setAttribute('href', 'style.css')
    //   linkToCSS.setAttribute('rel', 'stylesheet')
    //   linkToCSS.setAttribute('type', 'text/css')
    //   styleElement.parentNode.insertBefore(linkToCSS, styleElement.nextSibling)
    //   styleElement.parentNode.removeChild(styleElement)
    // })
    // styleElements //?

    return prettier.format(modifyHTML, {
      parser: 'html',
    })
  }
}

import fs from 'fs'
import path from 'path'
const html = fs.readFileSync(
  path.join(__dirname, './__tests__/fixture.html'),
  'utf8',
)
const rules: NotionRule[] = [
  {
    type: 'create',
    operation: {
      element: 'link',
      siblingOf: 'title',
      args: {
        href: 'style.css',
        rel: 'stylesheet',
        type: 'text/css',
      },
    },
  },
  {
    type: 'delete',
    operation: {
      selectorAll: 'style',
    },
  },
]
const notion = new Notion(rules)
notion.modifyHTML(html) //?
