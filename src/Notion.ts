import { JSDOM } from 'jsdom'
import prettier from 'prettier'

interface NotionRuleCreate {
  element: string
  siblingOf?: string
  childOf?: string
  args: { [key: string]: string | null }
}

// type IdentifyFn = { <T>(arg: T): T }
type IdentifyFn = { (arg: string): string }

interface NotionRuleUpdate {
  element: string
  args: { [key: string]: string | null | IdentifyFn }
}

interface NotionRuleDelete {
  selectorAll: string
}

export interface NotionRule {
  type: 'create' | 'update' | 'delete'
  operation: NotionRuleCreate | NotionRuleUpdate | NotionRuleDelete
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
      if (key === 'innerHTML') {
        element.innerHTML = value
      } else {
        element.setAttribute(key, value)
      }
    })
    if (operation.siblingOf) {
      const siblineElement = dom.window.document.querySelector(
        operation.siblingOf,
      )
      siblineElement.parentNode.insertBefore(
        element,
        siblineElement.nextSibling,
      )
    }
    if (operation.childOf) {
      const parentElement = dom.window.document.querySelector(operation.childOf)
      parentElement.insertBefore(element, parentElement.firstChild)
    }
    return dom.serialize()
  }

  _applyUpdate(rule: NotionRule, dom: JSDOM) {
    const operation: NotionRuleUpdate = rule.operation as NotionRuleUpdate
    const element = dom.window.document.querySelector(operation.element)
    Object.entries(operation.args).forEach(([key, value]) => {
      if (typeof value === 'string') {
        if (key === 'innerHTML') {
          element.innerHTML = value
        } else {
          element.setAttribute(key, value)
        }
      } else if (typeof value === 'function') {
        if (key === 'innerHTML') {
          element.innerHTML = value(element[key])
        } else {
          element.setAttribute(key, value(element[key]))
        }
      } else {
        throw new Error(`typeof value is unknown`)
      }
    })
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
        case 'update':
          modifyHTML = this._applyUpdate(rule, dom)
          break
        case 'delete':
          modifyHTML = this._applyDelete(rule, dom)
          break
        default:
          console.log('warn: unknown rule')
          break
      }
    })

    return prettier.format(modifyHTML, {
      parser: 'html',
    })
  }
}
