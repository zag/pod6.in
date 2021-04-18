import React, { useCallback } from 'react';
import Editor, {ConverterResult} from '@podlite/editor-react'
import '@podlite/editor-react/src/Editor.css'
import Podlite from '@podlite/to-jsx'
import toast from "cogo-toast"
import copy from "copy-to-clipboard"
import { ImListNumbered } from 'react-icons/im'
import {BsArrowsFullscreen, AiOutlineClear, AiOutlineLink} from 'react-icons/all'
import { useHistory } from "react-router-dom"
import { podlite as podlite_core } from "podlite";
import { plugin as DiagramPlugin } from '@podlite/diagrams'

import '../node_modules/codemirror/lib/codemirror.css';

import './App.css';
import "@podlite/editor-react/src/Editor.css"

import { version, parse } from 'pod6'


let deftext = 
`=head1 Title
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
Use a C<for> loop instead.N<The Raku C<for> loop is far more
powerful than its Perl 5 predecessor.> Preferably with an explicit
iterator variable.

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
const { useState, useMemo,  useEffect } = React;

const App1: React.FC = () => {
    const [showTree, setShowTree] = useState(false)
    const [isLineNumbers, setLineNumbers] = useState(false)
    const [isFullScreenPreview, setFullScreenPreview] = useState(false)
    let history = useHistory()
    let default_text 
    if (history && history.location ) {
         const params = new URLSearchParams(history.location.hash)
         default_text = params.get('#p')
    }
    const [query, setQuery] = useState(default_text || deftext)

    // wrap all elements and add line link info
    const wrapFunction = (node: Node, children) => {
        if (typeof node !== 'string' && 'type' in node && 'location' in node) {
            const line = node.location.start.line
            return <div key={line} className="line-src" data-line={line} id={`line-${line}`}>{children}</div>
        } else {
            return children
        }
    }
    const updateHistory = (query )=>{
        const params = new URLSearchParams()
        if (query) {
          params.append("p", query)
        } else {
          params.delete("p")
        }
        if (history) {
         history.push({hash: params.toString()})
        }  
    }
    const onConvertSource = (text:string):ConverterResult=>{
        if (showTree ) {
            const previewCode = <div  className=" right"><pre><code className="right" style={{textAlign:"left"}}>{JSON.stringify(parse(text), null, 2)}</code></pre></div>
            return {result:previewCode}
        }
        updateHistory(text)
        setChanged(true)

        let podlite = podlite_core({ importPlugins: true }).use({
            Diagram: DiagramPlugin,
          });
          let tree = podlite.parse(text);
          const asAst = podlite.toAstResult(tree);

        return { result : <Podlite wrapElement={wrapFunction} tree={asAst} />, errors:asAst.errors }

    }
    
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
    const [isChanged, setChanged ] = useState(false)
    const copyToClipboard = () => {
        copy(document.location.href);
        toast.success(`Url to this text copied to clipboard`, {
          position: "top-center"
        });
      };
    console.log({query})
    return   <div className="App">
    <div style={{  'textAlign': 'left',
                    'margin': '0em 1em',
                    }}>
        <h1 className="title">pod6 online editor (<a target="_blank" rel="noopener noreferrer" href="https://github.com/zag/js-pod6">{version}</a>)</h1>
        <ImListNumbered className={ isLineNumbers ? 'iconOn' : 'iconOff' } title="toggle line numbers" onClick={()=>setLineNumbers(!isLineNumbers)}/>
        <BsArrowsFullscreen className={ isFullScreenPreview ? 'iconOn' : 'iconOff' } title="Toggle fullscreen" onClick={()=>setFullScreenPreview(!isFullScreenPreview)}/>
        <AiOutlineClear className={ isChanged ? 'iconOn' : 'iconOff' } title="Reset text to template" onClick={()=>{ 
            // setChanged(false); // setQuery(deftext);  // updateHistory(deftext);
            document.location.assign('/')
            }}/>
        <AiOutlineLink onClick={ copyToClipboard}  className='iconOn' title="Copy url to this text"/>
    </div>

    <Editor 
        isLineNumbers= {isLineNumbers}
        isPreviewModeEnabled = {isFullScreenPreview}
        content={query}  
        onChangeSource = { (content:string)=>{
            setQuery(content)
        } }
        sourceType= { 'pod6' }
        onConvertSource = { onConvertSource }
    /> 
    </div>
}
export default App1;
