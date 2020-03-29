function loginButton(state = {login: false, user: null}, action){
  switch(action.type){
    case 'LOGINED':
      console.log("LOGINED")
      return {login: true, user: action.user}
    default:
      return state
  }
}

export default loginButton
