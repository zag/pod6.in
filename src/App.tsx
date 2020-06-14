import React from 'react';
// import CodeMirror from 'react-codemirror'
import {Controlled as CodeMirror} from 'react-codemirror2'
import {EditorConfiguration} from 'codemirror'
// import debounce from "debounce"
import '../node_modules/codemirror/lib/codemirror.css';
// import AwesomeDebouncePromise from 'awesome-debounce-promise'
import './App.css';

//@ts-ignore
import { toHtml , version, parse } from 'pod6'

const deftext = 
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
const { useState, useRef, useEffect } = React;
// @ts-ignore
const getLine = ( node ) => {
  if (node.location) {
      return node.location.start.line
  }
  return undefined
}
const exportRule = {
  //@ts-ignore
  '*':( writer, processor ) => ( node, ctx, interator, def ) => {
      if (['block','para'].includes(node.type) || ['pod'].includes(node.name)) {
        // @ts-ignore
          const codeLine = getLine(node)
          if (codeLine) { writer.writeRaw(`<div class="line-src" data-line="${getLine(node)}" id="line-${getLine(node)}">`) }
          if (def) def(node, ctx, interator)
          if (codeLine) { writer.writeRaw("</div>") }
 
      } else {
          // console.log(node)
          if (def) def(node, ctx, interator)
      }
       
      }
  }
const makeHtml = (text:string) => {
  try {
   return toHtml().use(exportRule).run(text)
  } catch(e) {
    return `<p>There may have been an error.
Check pod6 syntax at <a target="_blank" href="https://raw.githubusercontent.com/zag/js-pod6/master/doc/S26-documentation.pod6">Synopsis 26</a>
or please, fill issue <a target="_blank" href="https://github.com/zag/js-pod6/issues">here</a>.</p><p>Technical details (please, attach this to issue):</p><pre><code>${e}</code></pre>`
  }
}
//@ts-ignore
function useDebouncedEffect(fn, deps, time) {
  const dependencies = [...deps, time] 
  useEffect(() => {
    const timeout = setTimeout(fn, time);
    return () => {
      clearTimeout(timeout);
    }
  }, dependencies);
}

let instanceCM:CodeMirror.Editor 
const App: React.FC = () => {
  const [text, updateText] = useState(deftext)
  const [marks, updateMarks] = useState([])
  const [, updateScrollMap] = useState([])
  const [result, updateResult] = useState(makeHtml(deftext))
  const [isPreviewScroll, setPreviewScrolling] = useState(false);
  const refValue = useRef(isPreviewScroll);
  const [showTree, setShowTree] = useState(false)

  useDebouncedEffect(() => {
    updateResult(makeHtml(text));
  }, [text], 100)

  useEffect(() => {
      refValue.current = isPreviewScroll;
  });
  var options: EditorConfiguration = {
    lineNumbers: true,
     inputStyle: "contenteditable",
     //@ts-ignore
     spellcheck: true,
     autofocus:true,
 };

//  const result = JSON.stringify(parse(text), null, 2) ||  makeHtml(text)
 
 const previewEl = useRef(null)

 useEffect(() => {
   //@ts-ignore
    const newScrollMap = [...document.querySelectorAll('.line-src')]
                    .map(n => {
                                const line = parseInt(n.getAttribute('data-line'),10 )
                                const offsetTop = n.offsetTop
                                return { line, offsetTop}
                    })
    //@ts-ignore                      
    updateScrollMap(newScrollMap)
    //@ts-ignore
    const listener = (e) => { 
      if (!isPreviewScroll ) {return}
      let element = e.target
      //@ts-ignore
      const getLine = (offset) => {
        const c = newScrollMap.filter( i => i.offsetTop > offset )
        const lineElement = c.shift() || newScrollMap[ newScrollMap.length - 1 ]
        return lineElement.line
        }
      const line  =  getLine(element.scrollTop)
      if (instanceCM) {
        const t = element.scrollTop === 0 ? 0 : instanceCM.charCoords({line: line, ch: 0}, "local").top;
        instanceCM.scrollTo(null, t);
      }
      return true
    }
    if (previewEl && previewEl.current) {
        //@ts-ignore
         previewEl.current.addEventListener("scroll", listener);
    }
    return () => {
      // @ts-ignore
      previewEl && previewEl.current && previewEl && previewEl.current.removeEventListener("scroll", listener);
    };
 },[text,isPreviewScroll])

 useEffect(() => {
   //@ts-ignore
   let cm = instanceCM
   if (!cm) {return}
   //@ts-ignore
  marks.forEach(marker => marker.clear())
  let cmMrks:Array<never> = []
  //@ts-ignore
  if (result.errors ) {
    //@ts-ignore
  result.errors.map((loc:any)=>{
    // @ts-ignore
    let from = {line: loc.start.line-1, ch: loc.start.column-1 - (loc.start.offset === loc.end.offset)};
    let to = {line: loc.end.line-1, ch: loc.end.column-1};
    cmMrks.push(
                //@ts-ignore
                cm.markText(
                    from,
                    to, 
                    {
                      className: 'syntax-error',
                      title: ';data.error.message',
                      css: "color : red"
                    }
                )
                    
    )
  })
  }
  updateMarks(cmMrks)
  
},[text])
 const previewCode = <div  className=" right"><pre><code className="right" style={{textAlign:"left"}}>{JSON.stringify(parse(text), null, 2)}</code></pre></div>
// console.log(result.toString())
//@ts-ignore
const previewHtml =  <div onMouseEnter={()=>setPreviewScrolling(true)} 
                          onMouseMove={()=>setPreviewScrolling(true)} ref={previewEl} className=" right"
dangerouslySetInnerHTML={{__html: result}} ></div>
//@ts-ignore
const scrollEditorHandler = (editor) => {
  if (refValue.current) { return }
  let scrollInfo = editor.getScrollInfo();
  // get line number of the top line in the page
  let lineNumber = editor.lineAtHeight(scrollInfo.top, 'local');
  if (previewEl) {
    const el = previewEl.current
    const elementId = `#line-${lineNumber}`
    const scrollToElement = document.querySelector(elementId)
    if (scrollToElement) {
      //@ts-ignore
      const scrollTo = scrollToElement.offsetTop
      //@ts-ignore
      el.scrollTo({
        top: scrollTo,
        left: 0,
        behavior: 'smooth'
      })
   }
    
  }
  }
  return (
    <div className="App">
      <h1 className="title">pod6 to html (<a target="_blank" rel="noopener noreferrer" href="https://www.npmjs.com/package/pod6">{version}</a>)</h1>
      <p onClick={ () => { console.log(`toogle ${showTree}`);setShowTree(!showTree)}} title="view tree" style={{'float':'right', marginTop:'-1.5em'}}>🔎</p>
      <div className="layout">
          <div className="left" onMouseEnter={()=>setPreviewScrolling(false)}
                                 onMouseMove={()=>setPreviewScrolling(false)}
          >
          <CodeMirror 
              value={text}
              editorDidMount={ editor => { instanceCM = editor } }
              onBeforeChange={ (editor, data, value) => { updateText(value) } }
              onScroll={scrollEditorHandler}
              options={options} 
              className="editor"
           />
           </div>
           {showTree ? previewCode : previewHtml}
      </div>
    </div>
  );
}

export default App;
