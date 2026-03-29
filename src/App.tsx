import React from 'react'
import PodliteEditor, { ConverterResult, HighlightedCode } from '@podlite/editor-react'
import { MathJaxProvider } from '@podlite/formula'
import '@podlite/formula/lib/default.css'
// @ts-ignore
import Podlite from '@podlite/to-jsx'
import toast from 'cogo-toast'
import copy from 'copy-to-clipboard'
import { ImMagicWand } from 'react-icons/im'
import { AiOutlineClear, AiOutlineLink, AiOutlineCamera } from 'react-icons/ai'
import { BsArrowsFullscreen, BsCardImage, BsSun, BsMoon } from 'react-icons/bs'
// @ts-ignore
import domtoimage from 'dom-to-image-more'
import { podlite as podlite_core } from 'podlite'
import { plugin as DiagramPlugin } from '@podlite/diagram'
import { isNamedBlock } from '@podlite/schema'
import { version } from '@podlite/schema'

import '@podlite/editor-react/esm/Editor.css'
import '@podlite/editor-react/esm/podlite-vars.css'
import '@podlite/to-jsx/lib/podlite.css'
import './App.css'

let deftext = `
=for toc :caption('Table of contents')
  head1, head2, head3

=head1 Title
=head2 Subtitle

Space stations feature I<hydroponic> gardens N<Plants grow without soil,
using mineral nutrient solutions.>, a necessity for B<long-term> missions.

This is an inline formulas example: F< y = \\sqrt{3x-1}+(1+x)^2 >

=for formula :caption('The Cauchy-Schwarz Inequality')
   \\left( \\sum_{k=1}^n a_k b_k \\right)^2 \\leq \\left( \\sum_{k=1}^n a_k^2 \\right) \\left( \\sum_{k=1}^n b_k^2 \\right)

See this L<link|https://en.wikipedia.org/wiki/Cauchy%E2%80%93Schwarz_inequality>

=head2 Diagrams

=begin Mermaid :caption('Diagram with caption')
graph LR
        A-->B
        B-->C
        C-->A
        D-->C
=end Mermaid

=begin comment
This is a commented text.
=end comment

=head2 Lists

Options B<are>:

=item1  Animal
=item2     Vertebrate
=item2     Invertebrate

=item1  Phase
=item2     Solid
=item2     Liquid
=item2     Gas
=item2     I<Chocolate>

=head2 Tables

=table
    Constants           1
    Variables           10
    Subroutines         33
    Everything else     57

=for table
    mouse    | mice
    horse    | horses
    elephant | elephants

=table
    Animal | Legs |    Eats
    =======================
    Zebra  +   4  + Cookies
    Human  +   2  +   Pizza
    Shark  +   0  +    Fish

=table
    X | O |
   ---+---+---
      | X | O
   ---+---+---
      |   | X

=table
    X   O
   ===========
        X   O
   ===========
            X

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

=begin markdown

## Header inside markdown

$$
\\operatorname{ker} f=\\{g\\in G:f(g)=e_{H}\\}{\\mbox{.}}
$$


 * list 1
   * level 2

=end markdown


  =alias PROGNAME    Earl Irradiatem Evermore
  =alias VENDOR      4D Kingdoms
  =alias TERMS_URLS  =item L<http://www.4dk.com/eie>
  =                  =item L<http://www.4dk.co.uk/eie.io/>
  =                  =item L<http://www.fordecay.ch/canttouchthis>

  The use of A<PROGNAME> is U<subject> to the terms and conditions
  laid out by A<VENDOR>, as specified at:

       A<TERMS_URLS>

=for code :allow(B)
This I<is> a B<text>

`
const { useState, useEffect } = React

interface AppProps {
  source?: string
  viewerMode?: boolean
}

const App1: React.FC<AppProps> = ({ source, viewerMode = false }) => {
  // URL state management (native hash, no react-router)
  type HashState = { p: string | null; f: boolean }

  const getStateFromHash = (): HashState => {
    const hash = window.location.hash.slice(1)
    const params = new URLSearchParams(hash)
    const p = params.get('p')
    const f = Boolean(params.get('f'))
    return { p, f }
  }

  const pushHash = (state: HashState) => {
    const params = new URLSearchParams()
    if (state.p) params.set('p', state.p)
    if (state.f) params.set('f', '1')
    window.location.hash = params.toString()
  }

  const modeView = viewerMode ? true : false

  let default_text = source || getStateFromHash().p
  let isFullscreenByDefault = viewerMode ? modeView : getStateFromHash().f

  const [query, setQuery] = useState(default_text || deftext)
  const [isFullScreenPreview, setFullScreenPreview] = useState(isFullscreenByDefault)
  const [isChanged, setChanged] = useState(false)
  const [isAutocompleteOn, setAutocomplete] = useState(true)
  const [isCardMode, setCardMode] = useState(false)
  const [cardTitle, setCardTitle] = useState('snippet.podlite')
  const cardRef = React.useRef<HTMLDivElement>(null)
  const [isDarkTheme, setDarkTheme] = useState(
    window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  )

  useEffect(() => {
    document.body.setAttribute('data-color-mode', isDarkTheme ? 'dark' : 'light')
  }, [isDarkTheme])

  // Calculate editor height: viewport minus toolbar
  const toolbarHeight = viewerMode ? 0 : 40
  const [editorHeight, setEditorHeight] = useState(window.innerHeight - toolbarHeight)
  useEffect(() => {
    const onResize = () => setEditorHeight(window.innerHeight - toolbarHeight)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [toolbarHeight])

  // wrap all elements and add line link info
  const wrapFunction = (node: any, children: any) => {
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

  const codeHighlightPlugins = (makeComponent: any) => {
    const mkComponent = (src: any) => (writer: any, processor: any) => (node: any, ctx: any, interator: any) => {
      return makeComponent(src, node, 'content' in node ? interator(node.content, { ...ctx }) : [], ctx)
    }
    const hcode = mkComponent(({ children, key, ...node }: any, ctx: any) => (
      <HighlightedCode node={node} keyProp={key} ctx={ctx}>
        {children}
      </HighlightedCode>
    ))
    return {
      ':code': hcode,
      code: hcode,
    }
  }

  const makePreview = (text: string): ConverterResult => {
    // Side effects moved to onChange to avoid setState during render
    let podlite = podlite_core({ importPlugins: true }).use({
      Diagram: DiagramPlugin,
    })
    let tree = podlite.parse(text)
    const asAst = podlite.toAstResult(tree)

    //@ts-ignore
    return { result: <Podlite wrapElement={wrapFunction} plugins={codeHighlightPlugins} tree={asAst} />, errors: asAst.errors }
  }

  // Syntax highlight Podlite source code for card view (One Dark Pro palette, high contrast)
  const highlightPodliteSource = (code: string): string => {
    return code.split('\n').map(line => {
      let html = line
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')

      // Directives: =head1, =item, =begin, =end, =for, =table, =code, etc.
      html = html.replace(
        /^(\s*)(=\w+)/,
        '$1<span style="color:#e06c75;font-weight:bold">$2</span>'
      )
      // Attributes: :key('value') or :key<value>
      html = html.replace(
        /(:[\w]+)(\()([^)]*)(\))/g,
        '<span style="color:#56b6c2;font-weight:bold">$1</span>$2<span style="color:#98c379">$3</span>$4'
      )
      html = html.replace(
        /(:[\w]+)(&lt;)([^&]*)(&gt;)/g,
        '<span style="color:#56b6c2;font-weight:bold">$1</span>$2<span style="color:#98c379">$3</span>$4'
      )
      // Formatting codes: B<>, I<>, C<>, L<>, etc.
      html = html.replace(
        /([BICLDNXZSFEUAKV])(&lt;)/g,
        '<span style="color:#e5c07b;font-weight:bold">$1$2</span>'
      )
      html = html.replace(
        /(&gt;)/g,
        '<span style="color:#e5c07b">$1</span>'
      )
      // Links
      html = html.replace(
        /(https?:\/\/[^\s&<>]+)/g,
        '<span style="color:#61afef;text-decoration:underline">$1</span>'
      )
      // Strings in single quotes
      html = html.replace(
        /&#39;([^&]*)&#39;/g,
        '<span style="color:#98c379">&#39;$1&#39;</span>'
      )

      return html
    }).join('\n')
  }

  // Code Card component for ray.so-style preview
  const CodeCard = () => {
    const bg = isDarkTheme
      ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)'
      : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    const windowBg = '#282c34'
    const titleBarBg = '#21252b'
    const textColor = '#abb2bf'

    return (
      <div ref={cardRef} style={{
        padding: '40px',
        background: bg,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        minHeight: '100%',
        boxSizing: 'border-box',
      }}>
        <div style={{
          background: windowBg,
          borderRadius: '10px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          overflow: 'hidden',
          maxWidth: '700px',
          width: '100%',
        }}>
          {/* Title bar */}
          <div style={{
            background: titleBarBg,
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            borderBottom: `1px solid ${isDarkTheme ? '#363b44' : '#363b44'}`,
          }}>
            <div style={{ display: 'flex', gap: '8px', marginRight: '12px' }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f56' }} />
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ffbd2e' }} />
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#27c93f' }} />
            </div>
            <span style={{ color: '#848d9e', fontSize: 13, fontFamily: 'Menlo,monospace' }}>
              {cardTitle}
            </span>
          </div>
          {/* Source code */}
          <pre style={{
            margin: 0,
            padding: '20px 24px',
            background: windowBg,
            color: textColor,
            fontSize: 14,
            lineHeight: 1.7,
            fontFamily: 'Menlo, Monaco, Consolas, monospace',
            overflow: 'auto',
            whiteSpace: 'pre',
            tabSize: 4,
            border: 'none',
            borderRadius: 0,
          }}
            dangerouslySetInnerHTML={{ __html: highlightPodliteSource(query) }}
          />
        </div>
      </div>
    )
  }

  const copyToClipboard = () => {
    copy(document.location.href)
    toast.success(`Url to this text copied to clipboard`, {
      position: 'top-center',
    })
  }

  const exportPng = () => {
    if (!isCardMode) {
      toast.warn('Switch to Card mode first (card icon)', { position: 'top-center' })
      return
    }
    const el = cardRef.current
    if (!el) {
      toast.warn('Card not ready', { position: 'top-center' })
      return
    }
    domtoimage.toPng(el, { quality: 1.0, style: { overflow: 'visible' } })
      .then((dataUrl: string) => {
        const link = document.createElement('a')
        link.download = 'podlite-snippet.png'
        link.href = dataUrl
        link.click()
        toast.success('PNG saved', { position: 'top-center' })
      })
      .catch((err: any) => {
        console.error('PNG export failed:', err)
        toast.error('PNG export failed', { position: 'top-center' })
      })
  }

  return (
    <div className="App">
      {viewerMode ? null : (
        <div style={{ textAlign: 'left', margin: '0em 1em', display: 'flex', alignItems: 'center' }}>
          <div>
            <BsArrowsFullscreen
              className={isFullScreenPreview ? 'iconOn' : 'iconOff'}
              title="Toggle fullscreen"
              onClick={() => setFullScreenPreview(!isFullScreenPreview)}
            />
            <AiOutlineClear
              className={isChanged ? 'iconOn' : 'iconOff'}
              title="Reset text to template"
              onClick={() => {
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
          <div style={{ flex: 1 }} />
          <h1 className="title" style={{ float: 'none', margin: 0 }}>
            <a href="https://podlite.org" target="_blank" rel="noopener noreferrer">
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
          <div style={{ flex: 1 }} />
          <div>
            <BsCardImage
              className={isCardMode ? 'iconOn' : 'iconOff'}
              title="Toggle code card mode"
              onClick={() => setCardMode(!isCardMode)}
            />
            {isDarkTheme ? (
              <BsSun
                onClick={() => setDarkTheme(false)}
                className="iconOn"
                title="Switch to light theme"
              />
            ) : (
              <BsMoon
                onClick={() => setDarkTheme(true)}
                className="iconOn"
                title="Switch to dark theme"
              />
            )}
          </div>
        </div>
      )}
      {isCardMode ? (
        <div style={{ display: 'flex', height: `${editorHeight}px` }}>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <PodliteEditor
              value={query}
              height={`${editorHeight}px`}
              enablePreview={false}
              enableAutocompletion={isAutocompleteOn}
              onChange={(value: string) => {
                setQuery(value)
                setChanged(true)
                pushHash({ p: value, f: isFullScreenPreview })
              }}
            />
          </div>
          <div style={{
            flex: 1,
            overflow: 'auto',
            background: isDarkTheme ? '#0d1117' : '#e8e8e8',
            position: 'relative',
          }}>
            <div style={{
              position: 'sticky',
              top: 8,
              zIndex: 10,
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 8,
              padding: '8px 16px',
            }}>
              <input
                id="card-title"
                name="card-title"
                value={cardTitle}
                onChange={(e) => setCardTitle(e.target.value)}
                style={{
                  padding: '6px 10px',
                  borderRadius: 6,
                  border: 'none',
                  fontSize: 13,
                  fontFamily: 'Menlo, monospace',
                  background: isDarkTheme ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                  color: isDarkTheme ? '#c9d1d9' : '#24292f',
                  outline: 'none',
                  width: `${Math.max(cardTitle.length, 8) + 3}ch`,
                }}
              />
              <button
                onClick={exportPng}
                title="Export as PNG"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 14px',
                  borderRadius: 6,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 500,
                  background: isDarkTheme ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                  color: isDarkTheme ? '#c9d1d9' : '#24292f',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <AiOutlineCamera size={16} /> Export PNG
              </button>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-start',
            }}>
              <CodeCard />
            </div>
          </div>
        </div>
      ) : (
        <MathJaxProvider src="/static/mathjax-3.2.2/es5/tex-chtml-full.js">
          <PodliteEditor
            value={query}
            height={`${editorHeight}px`}
            enablePreview={true}
            previewWidth={isFullScreenPreview ? '100%' : '50%'}
            enableAutocompletion={isAutocompleteOn}
            makePreviewComponent={makePreview}
            onChange={(value: string) => {
              setQuery(value)
              setChanged(true)
              pushHash({ p: value, f: isFullScreenPreview })
            }}
          />
        </MathJaxProvider>
      )}
    </div>
  )
}
export default App1
