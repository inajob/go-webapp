export const insertItem = (item) => ({
  type: 'INSERT_ITEM',
  item,
})
export const clearItem = (item) => ({
  type: 'CLEAR_ITEM',
  item,
})

export const logined = (user) => ({
  type: 'LOGINED',
  user: user,
})
export const updateMessage = (message) => ({
  type: 'UPDATE_MESSAGE',
  message: message,
})
export const error = (message) => ({
  type: 'ERROR',
})


export const updateKeyword = (keyword) => ({
  type: 'SEARCH_UPDATE_KEYWORD',
  keyword: keyword,
})

export const updateResults = (results) => ({
  type: 'SEARCH_UPDATE_RESULTS',
  results: results,
})
export const updateInstantResults = (name, keyword, results) => ({
  name,
  type: 'INSTANT_SEARCH_UPDATE_RESULT',
  keyword: keyword,
  results: results,
})
export const clearInstantResults = (name) => ({
  name,
  type: 'INSTANT_SEARCH_CLEAR',
})

export const modalListUp = () => ({
  type: 'MODAL_LIST_UP',
})
export const modalListDown = () => ({
  type: 'MODAL_LIST_DOWN',
})
export const modalListUpdateProviders = (providers) => ({
  type: 'MODAL_LIST_UPDATE_PROVIDERS',
  providers: providers
})
export const modalListUpdateList = (list) => ({
  type: 'MODAL_LIST_UPDATE_LIST',
  list: list
})
export const modalListUpdateQuery = (query) => ({
  type: 'MODAL_LIST_UPDATE_QUERY',
  query: query
})
export const modalListOpen = (no, pos, text) => ({
  type: 'MODAL_LIST_OPEN',
  no: no,
  pos: pos,
  text: text,
})
export const modalListClose = () => ({
  type: 'MODAL_LIST_CLOSE',
})
export const showPopupMenu = (left, top) => ({
  type: 'POPUP_SHOW',
  left: left,
  top: top,
})
export const hidePopupMenu = (left, top) => ({
  type: 'POPUP_HIDE',
  left: left,
  top: top,
})
export const updatePopupMenu = (items) => ({
  type: 'POPUP_UPDATE_ITEMS',
  items: items,
})

