import { combineReducers } from 'redux'
import lines from '../inline-editor/reducers/lines'
import cursor from '../inline-editor/reducers/cursor'
import items from './items'
import loginButton from './loginButton'
import search from './search'
import instantSearch from './instantSearch'
import modalList from './modalList'

function createFilteredReducer(reducerFunction, reducerPredicate){
  return (state, action) => {
    const isInitializationCall = state === undefined;
    const shouldRunWrappedReducer = reducerPredicate(action) || isInitializationCall
    return shouldRunWrappedReducer ? reducerFunction(state, action): state;
  }
}

export default combineReducers({
  lines: createFilteredReducer(lines, action => action.name === "main"),
  sideLines: createFilteredReducer(lines, action => action.name === "side"),
  cursor: createFilteredReducer(cursor, action => action.name === "main"),
  sideCursor:  createFilteredReducer(cursor, action => action.name === "side"),
  items,
  loginButton,
  search,
  instantSearch,
  modalList,
})
