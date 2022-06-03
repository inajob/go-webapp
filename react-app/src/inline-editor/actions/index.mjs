
export const previewLine = (name, no, preview) => ({
  name,
  type: 'PREVIEW_LINE',
  preview,
  no,
})

export const changeLine = (name, no, text, preview) => ({
  name,
  type: 'CHANGE_LINE',
  text,
  preview,
  no,
})

export const deleteLine = (name, no, text) => ({
  name,
  type: 'DELETE_LINE',
  text,
  no,
})

export const insertLine = (name, no, text, preview) => ({
  name,
  type: 'INSERT_LINE',
  text,
  preview,
  no,
})

export const selectLine = (name, no, selected) => ({
  name,
  type: 'SELECT_LINE',
  no,
  selected,
})

export const deselectAll = (name) => ({
  name,
  type: 'DESELECT_ALL',
})


export const clearAll = (name) => ({
  name,
  type: 'CLEAR_ALL',
})


export const setCursor = function(name, row, col, dirty) {
  return ({
  name,
  type: 'SET_CURSOR',
  row,
  col,
  dirty,
})
}

export const setReadOnly = (name) => ({
  name,
  type: 'SET_READONLY',
})

export const setReadWrite = (name) => ({
  name,
  type: 'SET_READWRITE',
})

export const setTitle = (name, title) => ({
  name,
  type: 'SET_TITLE',
  title,
})

