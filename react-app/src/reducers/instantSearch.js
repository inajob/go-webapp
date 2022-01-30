function instantSearch(state = {results:{}}, action){
  switch(action.type){
    case 'INSTANT_SEARCH_UPDATE_RESULT':
      let s = {}
      for(let key in state.results){
        s[key] = state.results[key].slice()
      }
      s[action.keyword] = action.results
      return {results: s}
    case 'INSTANT_SEARCH_CLEAR':
      return {results: {}}
    default:
      return state
  }
}

export default instantSearch
