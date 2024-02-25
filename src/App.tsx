import React from 'react'
import Editor, { ConverterResult } from '@podlite/editor-react'
// @ts-ignore
import Podlite from '@podlite/to-jsx'
import toast from 'cogo-toast'
import copy from 'copy-to-clipboard'
import { ImListNumbered, ImMagicWand } from 'react-icons/im'
import { AiOutlineClear, AiOutlineLink } from 'react-icons/ai'
import { BsArrowsFullscreen } from 'react-icons/bs'
import { useHistory } from 'react-router-dom'
import { podlite as podlite_core } from 'podlite'
import { plugin as DiagramPlugin } from '@podlite/diagram'
import { isNamedBlock } from '@podlite/schema'
import { version, parse, Node } from '@podlite/schema'


import '@podlite/editor-react/lib/index.css'
import '../node_modules/codemirror/lib/codemirror.css'
import '../node_modules/codemirror/addon/dialog/dialog.css'
import 'codemirror/addon/hint/show-hint'

import './App.css'

let deftext = `=head1 Title
=head2 Subtitle

=for code :allow(B)
This I<is> a B<text>

  =alias PROGNAME    Earl Irradiatem Evermore
  =alias VENDOR      4D Kingdoms
  =alias TERMS_URLS  =item L<http://www.4dk.com/eie>
  =                  =item L<http://www.4dk.co.uk/eie.io/>
  =                  =item L<http://www.fordecay.ch/canttouchthis>
  
  The use of A<PROGNAME> is U<subject> to the terms and conditions
  laid out by A<VENDOR>, as specified at:
  
       A<TERMS_URLS>

=para
Space stations feature hydroponic gardens B<N<Plants grow without soil,
using mineral nutrient solutions.>>, a necessity for long-term missions.


Options B<are>:

=item1  Animal
=item2     Vertebrate
=item2     Invertebrate

=item1  Phase
=item2     Solid
=item2     Liquid
=item2     Gas
=item2     I<Chocolate>

I<Table>

=begin table :caption('Super table!')
                        Secret
        Superhero       Identity          Superpower
        =============   ===============   ===================
        The Shoveller   Eddie Stevens     King Arthur's
                                          singing shovel

        Blue Raja       Geoffrey Smith    Master of cutlery

        Mr Furious      Roy Orson         Ticking time bomb
                                          of fury

        The Bowler      Carol Pinnsler    Haunted bowling ball

=end table
`
const { useState, useEffect } = React

const App1: React.FC = () => {
  const [showTree] = useState(false)
  const [isLineNumbers, setLineNumbers] = useState(false)
  let history = useHistory()

  // URL state management
  type GetHashStringParams = { p: string; f: boolean }
  const pushHistory = (args: GetHashStringParams) => {
    const result = getHashString(args)
    if (history) {
      history.push({ hash: result })
    }
  }

  const getHashString = ({ p: planText, f: isFullScreen }: GetHashStringParams): string => {
    const params = new URLSearchParams()
    planText ? params.append('p', planText) : params.delete('p')
    isFullScreen ? params.append('f', '1') : params.delete('f')
    return params.toString()
  }

  const getStateFromHash = (): GetHashStringParams => {
    if (history && history.location) {
      const params = new URLSearchParams(history.location.hash)
      const p = params.get('#p') || params.get('p')
      const f = Boolean(params.get('f') || params.get('#f'))
      return { p, f }
    } else {
      return { p: null, f: null }
    }
  }
  // URL state management

  let default_text = getStateFromHash().p
  let isFullscreenByDefault = getStateFromHash().f

  const [query, setQuery] = useState(default_text || deftext)

  const [isFullScreenPreview, setFullScreenPreview] = useState(isFullscreenByDefault)

  // wrap all elements and add line link info
  const wrapFunction = (node: any, children) => {
    if (
      typeof node !== 'string' &&
      'type' in node &&
      'location' in node &&
      node.type === 'block' &&
      (['para', 'head', 'item', 'table', 'comment', 'nested', 'input', 'output', 'pod', 'caption'].includes(
        node.name,
      ) ||
        isNamedBlock(node.name))
    ) {
      //@ts-ignore
      const line = node.location.start.line
      return (
        <div key={line} className="line-src" data-line={line} id={`line-${line}`}>
          {children}
        </div>
      )
    } else {
      return children
    }
  }

  const onConvertSource = (text: string): ConverterResult => {

    if (showTree) {
      const previewCode = (
        <div className=" right">
          <pre>
            <code className="right" style={{ textAlign: 'left' }}>
              {JSON.stringify(parse(text), null, 2)}
            </code>
          </pre>
        </div>
      )
      return { result: previewCode }
    }

    pushHistory({
      p: text,
      f: isFullScreenPreview,
    })

    setChanged(true)

    let podlite = podlite_core({ importPlugins: true }).use({
      Diagram: DiagramPlugin,
    })
    let tree = podlite.parse(text)
    const asAst = podlite.toAstResult(tree)

    //@ts-ignore
    return { result: <Podlite wrapElement={wrapFunction} tree={asAst} />, errors: asAst.errors }
  }

  useEffect(() => {
    pushHistory({
      p: getStateFromHash().p,
      f: isFullScreenPreview,
    })
  }, [isFullScreenPreview])

  // useEffect(() => {
  //     const params = new URLSearchParams()
  //     if (query) {
  //       params.append("p", query)
  //     } else {
  //       params.delete("p")
  //     }
  //     if (history) {
  //      history.push({hash: params.toString()})
  //     }
  //   }, [query, history])

  // reset text to template
  const [isChanged, setChanged] = useState(false)
  const [isAutocompleteOn, setAutocomplete] = useState(true)

  const copyToClipboard = () => {
    copy(document.location.href)
    toast.success(`Url to this text copied to clipboard`, {
      position: 'top-center',
    })
  }
  return (
    <div className="App">
      <div style={{ textAlign: 'left', margin: '0em 1em' }}>
        <h1 className="title">
          <a href="https://podlite.org" target="_blank">
            Podlite
          </a>{' '}
          online editor (
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://github.com/podlite/podlite/tree/main/packages/podlite-schema"
          >
            {version}
          </a>
          )
        </h1>
        <ImListNumbered
          className={isLineNumbers ? 'iconOn' : 'iconOff'}
          title="toggle line numbers"
          onClick={() => setLineNumbers(!isLineNumbers)}
        />
        <BsArrowsFullscreen
          className={isFullScreenPreview ? 'iconOn' : 'iconOff'}
          title="Toggle fullscreen"
          onClick={() => setFullScreenPreview(!isFullScreenPreview)}
        />
        <AiOutlineClear
          className={isChanged ? 'iconOn' : 'iconOff'}
          title="Reset text to template"
          onClick={() => {
            // setChanged(false); // setQuery(deftext);  // updateHistory(deftext);
            if (window.confirm('Are you really sure?')) {
              document.location.assign('/')
            }
          }}
        />
        <AiOutlineLink onClick={copyToClipboard} className="iconOn" title="Copy url to this text" />
        <ImMagicWand
          onClick={() => setAutocomplete(!isAutocompleteOn)}
          className={isAutocompleteOn ? 'iconOn' : 'iconOff'}
          title="toggle autocomplete for directives"
        />
      </div>

      <Editor
        isLineNumbers={isLineNumbers}
        isPreviewModeEnabled={isFullScreenPreview}
        isControlled={true}
        isAutoComplete={isAutocompleteOn}
        content={query}
        onChangeSource={(content: string) => {
          setQuery(content)
        }}
        sourceType={'pod6'}
        onConvertSource={onConvertSource}
      />
    </div>
  )
}
export default App1
