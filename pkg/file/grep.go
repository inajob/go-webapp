package file

import (
  "os"
  "time"
  "bufio"
  "strings"
  "path/filepath"
  "github.com/inajob/frontmatter"
)

type GrepResult struct {
  Path string `json:"path"`
  LineNo int `json:"lineNo"`
  Text string `json:"text"`
  Meta map[string]interface{} `json:"meta"`
  ModTime time.Time `json:"modTime"`
}

func grepFile(path string, keyword string) []GrepResult{
  results := make([]GrepResult, 0)

  info, err := os.Stat(path)
  if err != nil {
    return nil
  }

  file, err := os.Open(path)
  if err != nil {
    return nil
  }
  defer file.Close()
  scanner := bufio.NewScanner(file)
  // TODO: this requires memory
  for i := 1; scanner.Scan(); i++ {
    if strings.Contains(scanner.Text(), keyword) {
      r := GrepResult {
        Path: path,
        LineNo: i,
        Text: scanner.Text(),
        ModTime: info.ModTime(),
      }
      results = append(results, r)
    }
  }
  if len(results) > 0 {
    file.Seek(0, 0) // TODO: use above body data
    meta, _, err := frontmatter.ParseFrontMatter(file) // TODO: slow
    if err == nil {
      for i := 0; i < len(results); i ++ {
        results[i].Meta = meta
      }
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
