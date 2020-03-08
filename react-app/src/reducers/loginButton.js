function loginButton(state = {login: false, user: null}, action){
  let newState;
  switch(action.type){
    case 'LOGINED':
      console.log("LOGINED")
      return {login: true, user: action.user}
    default:
      return state
  }
  return state
}

export default loginButton
