function loginButton(state = {login: false, user: null, message: "Ready", isError: false}, action){
  switch(action.type){
    case 'LOGINED':
      console.log("LOGINED")
      return {login: true, user: action.user, message: state.message, isError: state.isError}
    case 'UPDATE_MESSAGE':
      console.log("update message",action)
      return {login: state.login, user: state.user, message: action.message, isError: state.isError}
    case 'ERROR':
      return {login: state.login, user: state.user, message: state.message, isError: true}

    default:
      return state
  }
}

export default loginButton
