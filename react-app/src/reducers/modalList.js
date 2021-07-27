function modalList(state = {phase: "NONE", query: "", providers:[], providerIndex: 0, list:[], index: 0}, action){
  // phase: NONE, PROVIDERS, LIST
  /*
   index // list index
   list.title
       .image
       .text  // insert this text
  */
  switch(action.type){
    case 'MODAL_LIST_UPDATE_QUERY':
      return {query: action.query, phase: state.phase, providers: state.providers, providerIndex: state.providerIndex , list: state.list, index: state.index, targetLine: state.targetLine}
    case 'MODAL_LIST_UPDATE_PROVIDERS':
      return {query: state.query, phase: "PROVIDERS", providers: action.providers, providerIndex: 0 , list: state.list, index: state.index, targetLine: state.targetLine}
    case 'MODAL_LIST_UPDATE_LIST':
      return {query: state.query, phase: "LIST", providers: state.providers, providerIndex: state.providerIndex , list: action.list, index: 0, targetLine: state.targetLine}
    case 'MODAL_LIST_UP':
      switch(state.phase){
        case "LIST":
        if(state.index > 0){
          return {query: state.query, phase: state.phase, providers: state.providers, providerIndex: state.providerIndex, list: state.list, index: state.index - 1, targetLine: state.targetLine}
        }
        break;
        case "PROVIDERS":
        if(state.providerIndex > 0){
          return {query: state.query, phase: state.phase, providers: state.providers, providerIndex: state.providerIndex - 1, list: state.list, index: state.index, targetLine: state.targetLine}
        }
        break;
        default:
          throw new Error("unknown phase", state.phase)
      }
      return state
    case 'MODAL_LIST_DOWN':
      switch(state.phase){
        case "LIST":
        if(state.index < state.list.length - 1){
          return {query: state.query, phase: state.phase, providers: state.providers, providerIndex: state.providerIndex, list: state.list, index: state.index + 1, targetLine: state.targetLine}
        }
        break;
        case "PROVIDERS":
        if(state.providerIndex < state.providers.length - 1){
          return {query: state.query, phase: state.phase, providers: state.providers, providerIndex: state.providerIndex + 1, list: state.list, index: state.index, targetLine: state.targetLine}
        }
        break;
        default:
          throw new Error("unknown phase", state.phase)
      }
      return state
    case 'MODAL_LIST_OPEN':
      return {query: state.query, phase: "PROVIDERS", providers: state.providers, providerIndex: state.providerIndex, list: [], index: 0, targetLine: {no: action.no, pos: action.pos, text: action.text}}
    case 'MODAL_LIST_CLOSE':
      return {query: state.query, phase: "NONE", providers: state.providers, providerIndex: state.providerIndex, list: [], index: 0, targetLine: state.targetLine}
    default:
      return state
  }
}

export default modalList
