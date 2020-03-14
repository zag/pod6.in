import React from 'react';
import CodeMirror from 'react-codemirror'
import '../node_modules/codemirror/lib/codemirror.css';
import './App.css';

//@ts-ignore
import { toHtml , version } from 'pod6'

const deftext = 
`=head1 Title
=head2 Subtitle
      
=for code :allow(B)
This I<is> a B<text>

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
  const [text, updateText] = useState(deftext)
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
  if (result.errors ) {
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
  return (
    <div className="App">
      <h1 className="title">pod6 to html (<a target="_blank" href="https://www.npmjs.com/package/pod6">{version}</a>)</h1>
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
