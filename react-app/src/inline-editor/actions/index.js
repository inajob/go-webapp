
export const previewLine = (no, preview) => ({
  type: 'PREVIEW_LINE',
  preview,
  no,
})

export const changeLine = (no, text, preview) => ({
  type: 'CHANGE_LINE',
  text,
  preview,
  no,
})

export const deleteLine = (no, text) => ({
  type: 'DELETE_LINE',
  text,
  no,
})

export const insertLine = (no, text, preview) => ({
  type: 'INSERT_LINE',
  text,
  preview,
  no,
})

export const setCursor = (row, col, dirty) => ({
  type: 'SET_CURSOR',
  row,
  col,
  dirty,
})

export const setReadOnly = () => ({
  type: 'SET_READONLY',
})

export const setReadWrite = () => ({
  type: 'SET_READWRITE',
})

