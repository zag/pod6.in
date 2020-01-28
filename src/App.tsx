import React from 'react';
import CodeMirror from 'react-codemirror'
import '../node_modules/codemirror/lib/codemirror.css';
import './App.css';
//@ts-ignore
import { toHtml } from 'pod6'

const { useState } = React;
const makeHtml = (text:string) => {
  try {
   return toHtml().run(text)
  } catch(e) {
    console.log(e)
    return 'err'
  }
}
const App: React.FC = () => {
  const [text, updateText] = useState('');
  var options = {
    lineNumbers: true,
 };
  return (
    <div className="App">
      <h1 className="title">pod6 to html</h1>
      <div className="layout">
        <div className="layout__panel flex flex--row">
          <div className="layout__panel left">
          <CodeMirror value={text} autoFocus onChange={updateText} options={options} />
           </div>

          <div className="layout__panel right"
          dangerouslySetInnerHTML={{__html: makeHtml(text)}} ></div>
        </div>
      </div>
    </div>
  );
}

export default App;
