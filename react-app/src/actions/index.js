export const insertItem = (text) => ({
  type: 'INSERT_ITEM',
  text,
})

export const logined = (user) => ({
  type: 'LOGINED',
  user: user,
})

export const updateKeyword = (keyword) => ({
  type: 'SEARCH_UPDATE_KEYWORD',
  keyword: keyword,
})

export const updateResults = (results) => ({
  type: 'SEARCH_UPDATE_RESULTS',
  results: results,
})
