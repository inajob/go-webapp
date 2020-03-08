export const insertItem = (text) => ({
  type: 'INSERT_ITEM',
  text,
})

export const logined = (user) => ({
  type: 'LOGINED',
  user: user,
})
