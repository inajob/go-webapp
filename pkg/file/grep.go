package file

import (
  "os"
  "bufio"
  "strings"
  "path/filepath"
)

type GrepResult struct {
  Path string `json:"path"`
  LineNo int `json:"lineNo"`
  Text string `json:"text"`
}

func grepFile(path string, keyword string) []GrepResult{
  results := make([]GrepResult, 0)

  file, err := os.Open(path)
  if err != nil {
    return nil
  }
  defer file.Close()
  scanner := bufio.NewScanner(file)
  for i := 1; scanner.Scan(); i++ {
    if strings.Contains(scanner.Text(), keyword) {
      r := GrepResult {
        Path: path,
        LineNo: i,
        Text: scanner.Text(),
      }
      results = append(results, r)
    }
  }
  return results
}

func Grep(path string, keyword string) []GrepResult {
  results := make([]GrepResult, 0)
  filepath.Walk(path, func(path string, file os.FileInfo, err error) error{
    rs := grepFile(path, keyword)
    if len(rs) > 0 {
      results = append(results, rs...)
    }
    return nil
  })
  return results
}
