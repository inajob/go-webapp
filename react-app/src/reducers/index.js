import { combineReducers } from 'redux'
import lines from '../inline-editor/reducers/lines'
import cursor from '../inline-editor/reducers/cursor'
import items from './items'
import loginButton from './loginButton'
import search from './search'

export default combineReducers({
  lines,
  cursor,
  items,
  loginButton,
  search,
})
