import React from 'react'
import ReactDOM from 'react-dom'
import './index.css'
import App from './App'
import * as serviceWorker from './serviceWorker'

// init
// try to get predefined source from html
const tmpl_node = document.getElementById('template')
const tmpl = tmpl_node?.textContent || tmpl_node?.innerText || null

ReactDOM.render(
  tmpl ? <App source={tmpl} viewerMode={!!tmpl_node} /> : <App />,
  document.getElementById('root'),
)

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister()
