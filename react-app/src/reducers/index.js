import { combineReducers } from 'redux'
import lines from '../inline-editor/reducers/lines'
import cursor from '../inline-editor/reducers/cursor'
import items from './items'
import loginButton from './loginButton'
import search from './search'
import instantSearch from './instantSearch'
import modalList from './modalList'
import popupMenu from './popupMenu'

function createFilteredReducer(reducerFunction, reducerPredicate){
  return (state, action) => {
    const isInitializationCall = state === undefined;
    const shouldRunWrappedReducer = reducerPredicate(action) || isInitializationCall
    return shouldRunWrappedReducer ? reducerFunction(state, action): state;
  }
}

export default combineReducers({
  lines: createFilteredReducer(lines, action => action.name === "main"),
  cursor: createFilteredReducer(cursor, action => action.name === "main"),

  sideLines: createFilteredReducer(lines, action => action.name === "side"),
  sideCursor:  createFilteredReducer(cursor, action => action.name === "side"),
  rightCursor:  createFilteredReducer(cursor, action => action.name === "right"),
  rightLines: createFilteredReducer(lines, action => action.name === "right"),
  items,
  loginButton,
  search,
  instantSearch: createFilteredReducer(instantSearch, action => action.name === "main"),
  rightInstantSearch: createFilteredReducer(instantSearch, action => action.name === "right"),
  modalList,
  popupMenu,
})
