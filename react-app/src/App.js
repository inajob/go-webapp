import React from 'react'
import Lines from './inline-editor/components/Lines'
import List from './components/List'

const App = () => (
  <div>
    <div style={{paddingLeft:"100px"}}>
      <div>
        <button>New</button>
      </div>

      <Lines />
    </div>

    <div style={{position:"absolute",top:"0px",left:"0px",backgroundColor:"#fdd",width:"100px"}}>
      <List />
    </div>

  </div>
)

export default App
