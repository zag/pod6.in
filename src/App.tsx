import React from 'react';
import CodeMirror from 'react-codemirror'
import '../node_modules/codemirror/lib/codemirror.css';
import './App.css';
//@ts-ignore
import { toHtml } from 'pod6'

const { useState, useRef, useEffect } = React;
const makeHtml = (text:string) => {
  try {
   return toHtml().run(text)
  } catch(e) {
    return `<p>There may have been an error.
Check pod6 syntax at <a target="_blank" href="https://raw.githubusercontent.com/zag/js-pod6/master/doc/S26-documentation.pod6">Synopsis 26</a>
or please, fill issue <a target="_blank" href="https://github.com/zag/js-pod6/issues">here</a>.</p><p>Technical details (please, attach this to issue):</p><pre><code>${e}</code></pre>`
  }
}
const App: React.FC = () => {
  const [text, updateText] = useState('')
  const [marks, updateMarks] = useState([])

  var options = {
    lineNumbers: true,
 };

 const inputEl = useRef(null)
 const result = makeHtml(text)
 useEffect(() => {
   //@ts-ignore
   let cm = inputEl.current.getCodeMirror()
   //@ts-ignore
  marks.forEach(marker => marker.clear())
  let cmMrks:Array<never> = []
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
  updateMarks(cmMrks)
  
},[text])
  return (
    <div className="App">
      <h1 className="title">pod6 to html</h1>
      <div className="layout">
        <div className="layout__panel flex flex--row">
          <div className="layout__panel left">
          <CodeMirror value={text} ref={inputEl} autoFocus onChange={updateText} options={options} />
           </div>
          <div className="layout__panel right"
          dangerouslySetInnerHTML={{__html: result}} ></div>
        </div>
      </div>
    </div>
  );
}

export default App;
