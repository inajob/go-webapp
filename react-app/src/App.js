import React from 'react'
import Lines from './inline-editor/components/Lines'
import List from './components/List'
import LoginButton from './components/LoginButton'
import Search from './components/Search'
import ModalList from './components/ModalList'
import Controller from './components/Controller'
import { connect } from 'react-redux'
import {insertLine, setReadOnly, setReadWrite} from './inline-editor/actions'
import {Render} from './inline-editor/utils/render'
import { updateKeyword, updateResults,
  modalListUpdateList,modalListUp, modalListDown, modalListOpen, modalListClose, modalListUpdateQuery
} from './actions'
import {jsonp} from './utils/jsonp';

class App extends React.Component{
  render() {
  return (
  <div>
    <div className="header">
      <div className="logo">
      <h1>inline</h1>
      <div style={{backgroundColor: "#eee", fontSize:"small"}}>"inline" はインライン編集できるWIKIのようなものです</div>
      </div>
      <LoginButton logined={this.props.loginButton.login} user={this.props.loginButton.user} onLoginClick={this.props.onLoginClick} onLogoutClick={this.props.onLogoutClick} />
    </div>
    <div>
      <Controller logined={this.props.loginButton.login} onNewDiary={this.props.onNewDiary} onNewJunk={this.props.onNewJunk} onDebug={this.props.onDebug} />
    </div>
    <div className="contents">
      <div className="main">
        <Search onUpdateKeyword={this.props.updateKeyword} onSearch={this.props.onSearch(this.props.sendSearch)} keyword={this.props.search.keyword} results={this.props.search.results} />

        <Lines lines={this.props.lines} cursor={this.props.cursor} onMagic={this.props.onMagic} onUpdate={this.props.onUpdate} />

        <div className="instant-search">
          {Object.keys(this.props.instantSearch.results).map((k, j) => (
            <div className="piece" key={j}>
              <div>{k}</div>
              <div className="pages">
              {this.props.instantSearch.results[k].map((r, i) => (
                <li key={i}><div><a href={"?user=" + r.user + "&id=" + r.id}>{r.id}</a></div><div>{r.text}</div></li>
              ))}
              </div>
            </div>
          ))}
        </div>

      </div>
      <div className="side">
        <List items={this.props.items} user={this.props.user} />
      </div>
    </div>
    <ModalList
      {...this.props.modalList}
      cursor={this.props.cursor}
      onKeyDown={this.props.onModalKeyDown}
      onModalQueryChange={this.props.onModalQueryChange}
    />
  </div>
  )
  }}
const mapStateToProps = (state, ownProps) => {
  return {
    lines: state.lines,
    cursor: state.cursor,
    items: state.items,
    loginButton: state.loginButton,
    search: state.search,
    instantSearch: state.instantSearch,
    modalList: state.modalList,
  }
}
const mapDispatchToProps = (dispatch) => {
  return {
    onModalQueryChange: (e) =>{
      dispatch(modalListUpdateQuery(e.target.value))
    },
    onModalKeyDown: (query, phase, provider, index, text, cursor) => (e) => {
      switch(e.keyCode){
        case 27: // esc
        dispatch(modalListClose())
        dispatch(setReadWrite())
        break;
        case 38: // up
        dispatch(modalListUp())
        break;
        case 40: // down
        dispatch(modalListDown())
        break;
        case 13: // enter
          switch(phase){
            case "PROVIDERS":
              switch(provider.name){
                case "amazon":
                jsonp("amazon", "http://web.inajob.tk/ad/amz.php?callback=amazon&q=" + encodeURIComponent(query), function(data){
                  let list = []
                  data.forEach((i) => {
                    list.push({
                      title: i.title,
                      image: i.mimage[0],
                      text:  ">> item\n"+i.link[0]+ "\n" +i.mimage[0] + "\n" + i.title,
                    })
                  })
                  dispatch(modalListUpdateList(list))
                })
                break
                case "aliexpress":
                  throw new Error("not implemented yet")
                default:
                  throw new Error("unknown provider",provider.name)
              }
              break;
            case "LIST":
              dispatch(setReadWrite())
              dispatch(insertLine(cursor.row, text, Render(cursor.row, text)))
              dispatch(modalListClose())
              break;
            default:
              throw new Error("unknown phase", phase)
          }
        break;
        default:
      }
    },
    onSearch: (sendSearch) => (keyword) => {
      console.log("search", keyword)
      sendSearch(keyword).then((resp) => {
        resp.json().then((o) => {
          dispatch(updateResults(o.lines))
        })
      })
    },
    onMagic: () => {
      dispatch(setReadOnly())
      dispatch(modalListOpen())
    },
    onDebug: () => {
      dispatch(modalListOpen())
    },
    updateKeyword: (keyword) => {
      dispatch(updateKeyword(keyword))
    },
  }
}

const AppContainer = connect(mapStateToProps, mapDispatchToProps)(App)

export default AppContainer
