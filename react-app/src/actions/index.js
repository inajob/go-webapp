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
export const updateInstantResults = (keyword, results) => ({
  type: 'INSTANT_SEARCH_UPDATE_RESULT',
  keyword: keyword,
  results: results,
})
