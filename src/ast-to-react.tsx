//ts-nocheck
import React from 'react'
import ReactDOMServer from 'react-dom/server'
import { useMemo, useState, useCallback, useRef, useEffect } from 'react'
import { isValidElementType } from 'react-is'
import { version, toAny, parse } from '@podlite/schema'
import path from 'path'
// import { parseToAst } from './make-ast';
let i_key_i = 0
const createElement = React.createElement

const mapToReact = {
  // ':para' : ({children, line})=><p linesrc={line}>{children}</p>,
  // ':blankline': ({children})=><br/>,
  ':blankline': ({ children }) => null,

  // 'para':({line,children})=>React.createElement(`p`,{'data-line':line, className:"line-src", id:`line-${line}`}, children),
  para: ({ line, children }) => (
    <p data-line={line} className="line-src" id={`line-${line}`}>
      {children}
    </p>
  ),

  // ':para':({line,children})=>React.createElement(`p`,{'data-line':line, className:"line-src", id:`line-${line}`}, children),
  ':para': ({ line, children }) => (
    <p data-line={line} className="line-src" id={`line-${line}`}>
      {children}
    </p>
  ),

  pod: ({ children }) => <>{children}</>,
  ':text': ({ value }) => value,
  head: ({ level, children, line }) =>
    React.createElement(`h${level}`, { 'data-line': line, className: 'line-src', id: `line-${line}` }, children),
  'C<>': ({ children }) => createElement('code', {}, children),
  ':list': ({ children, itemized }) => createElement(itemized ? 'ul' : 'ol', {}, children),
  item: ({ children }) => createElement('li', {}, children),
  'L<>': ({ content, children }) => createElement('a', { href: content[0] }, children),
  'B<>': 'b',
  'I<>': 'i',
  Image: ({ content, children }) => createElement('img', { src: content[0].value }),
  code: ({ content, children }) => createElement('pre', {}, createElement('code', {}, children)),
  ':nested': 'blockquote',
  nested: 'blockquote',
  ':table': 'table',
  ':table_row': 'tr',
  ':table_cell': 'td',
  ':verbatim': ({ value }) => value,
  TITLE: ({ level = 1, children }) => React.createElement(`h${level}`, {}, children),
  DESCRIPTION: ({ level = 1, children }) => React.createElement(`h${level}`, {}, children),
}

export function AstToReact({ file, plugins = {} }: { file: string; plugins?: any }, ...args) {
  const content = file
  // const fileNameExtension = path.parse(file).ext
  // const type = 'pod6'
  const ast = useMemo(() => parse(content), [content])
  const map2react = {
    ...mapToReact,
    ...plugins,
  }
  const rules = {}
  let i_key_i = 0
  let mapByType = {}
  const getIdForNode = ({ type = 'notype', name = 'noname' }) => {
    const type_idx = `${type}_${name}`
    if (!mapByType[type_idx]) {
      mapByType[type_idx] = 0
    }
    ++mapByType[type_idx]
    return `${type_idx}_${mapByType[type_idx]}`
  }
  Object.keys(map2react).map(ruleName => {
    const makeElement = map2react[ruleName]

    rules[ruleName] = (writer, processor) => (node, ctx, interator) => {
      if (['Dia', 'para', ':para'].includes(ruleName)) {
        console.log('Dia here!')
        const { content, location, ...attr } = node
        const key = node.type ? getIdForNode(node) : ++i_key_i
        console.log({ key, node })
        const children = content ? interator(content, { ...ctx }) : undefined
        return makeElement({ ...attr, content, key, children, line: location?.start.line }, children)
      }
      if (!isValidElementType(makeElement)) {
        throw new Error(`Bad React element for ${ruleName} rule `)
      }
      const { content, location, ...attr } = node
      // console.log(JSON.stringify({node, location}, null,2))
      // const key = location ? [node.type,++i_key_i].join('-') : ++i_key_i
      const key = node.type ? getIdForNode(node) : ++i_key_i
      const children = content ? interator(content, { ...ctx }) : undefined
      return React.createElement(makeElement, { ...attr, content, key, line: location?.start.line }, children)
    }
  })
  const FirstLevel = ({ node }) => {
    const res = useMemo(() => {
      console.log('1')
      return toAny({ processor: 1 })
        .use({
          '*:*': (writer, processor) => (node, ctx, interator) => {
            console.warn(JSON.stringify(node, null, 2))
            // return undefined
            // return null
            return React.createElement(
              'code',
              { key: ++i_key_i },
              `not supported node:${JSON.stringify(node, null, 2)}`,
            )
          },
        })
        .use(rules)
        .run(node)
    }, [JSON.stringify(node)])
    return res.interator
  }
  // console.log({ast})
  // let reactResults = []
  // if (Array.isArray(ast) ) {
  //     for (let index = 0; index < ast.length; index++) {
  //         const element = ast[index];
  //         const comp = React.createElement(FirstLevel, {node:element})
  //         reactResults.push(comp)
  //         // console.log({element})
  //     }
  // }
  // return <>{ast.map((node, i ) => (<FirstLevel id={i} node={node}/>))}</>
  const res = useMemo(
    () =>
      toAny({ processor: 1 })
        .use({
          '*:*': (writer, processor) => (node, ctx, interator) => {
            console.warn(JSON.stringify(node, null, 2))
            // return undefined
            return React.createElement(
              'code',
              { key: ++i_key_i },
              `not supported node:${JSON.stringify(node, null, 2)}`,
            )
            if (node.children) interator(node.children, { ...ctx })
          },
        })
        .use(rules)
        .run(ast),
    [ast],
  )
  return res.interator
}

// export function contentToReact( {content, type, plugins={}}:{content:string, type:"pod6" | "md", plugins?:any} ) {

//     const   ast = parseToAst( content, type )
//     const map2react = {
//         ...mapToReact,
//         ...plugins
//     }
//     const rules = {}
//     Object.keys(map2react).map((ruleName)=>{
//         const makeElement = map2react[ruleName]

//         rules[ruleName] = ( writer, processor )=>( node, ctx, interator )=>{
//             if (!isValidElementType(makeElement)) {
//                 throw new Error(`Bad React element for ${ruleName} rule `)
//             }
//             const { content, location, ...attr} = node
//             const key = location ? [node.type, location.start.offset, location.end.offset].join('-') : ++i_key_i
//             const children = content ? interator(content, { ...ctx}) : undefined
//             return React.createElement(makeElement,{ ...attr, content, key, line: location?.start.line }, children  )
//         }
//     })

//     const  res = toAny({processor:1})
//         .use({'*:*':( writer, processor )=>( node, ctx, interator )=>{
//             console.warn(JSON.stringify(node,null,2))
//             // return undefined
//             return React.createElement('code',{key:++i_key_i},`not supported node:${JSON.stringify(node,null,2)}`)
//             if (node.children) interator(node.children, { ...ctx})
//         }})
//         .use(rules)
//         .run(ast)
//         if ( Array.isArray( res.interator ) ) {
//             return React.createElement('div', { }, res.interator   )
//             // return React.Fragment(res.inerator  )
//         }
//     return res.interator
// }

// export default function  MdToReact ({source,plugins={}},...args) {

//     const ast = useMemo( ()=>md2ast(source),[ source] )

//     const map2react = {
//         ...mapToReact,
//         ...plugins
//     }
//     // convert map to rules
//     const rules = {}
//     Object.keys(map2react).map((ruleName)=>{
//         const makeElement = map2react[ruleName]

//         rules[ruleName] = ( writer, processor )=>( node, ctx, interator )=>{
//             if (!isValidElementType(makeElement)) {
//                 throw new Error(`Bad React element for ${ruleName} rule `)
//             }
//             const { content, location, ...attr} = node
//             const key = location ? [node.type, location.start.offset, location.end.offset].join('-') : ++i_key_i
//             const children = content ? interator(content, { ...ctx}) : undefined
//             return React.createElement(makeElement,{ ...attr, content, key }, children  )
//         }
//     })

//     const  res =
//         toAny({processor:1})
//         .use({'*:*':( writer, processor )=>( node, ctx, interator )=>{
//             console.log(JSON.stringify(node,null,2))
//             // return undefined
//             return React.createElement('code',{key:++i_key_i},`not supported node:${JSON.stringify(node,null,2)}`)
//             if (node.children) interator(node.children, { ...ctx})
//         }})
//         .use(rules)
//         .run(ast)
//     return res.interator
// }
