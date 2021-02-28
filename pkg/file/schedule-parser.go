package file

import(
  "os"
  "bufio"
  "strings"
  "path/filepath"
  "github.com/inajob/frontmatter"
)

type ScheduleParserResult struct {
  Path string `json:"path"`
  LineNo int `json:"lineNo"`
  Text string `json:"text"`
  Meta map[string]interface{} `json:"meta"`
}

func parseFile(path string) []ScheduleParserResult{
  results := make([]ScheduleParserResult, 0)

  file, err := os.Open(path)
  if err != nil {
    return nil
  }
  defer file.Close()
  scanner := bufio.NewScanner(file)
  // TODO: this requires memory
  for i := 1; scanner.Scan(); i++ {
    target := scanner.Text()
    // 012345678901
    // [2020-01-01]
    if len(target) >= 12 && strings.HasPrefix(target, "[") {
      sep1 := target[5]
      sep2 := target[8]
      if sep1 == '-' &&
         sep2 == '-' {
           r := ScheduleParserResult {
             Path: path,
             LineNo: i,
             Text: scanner.Text(),
           }
           results = append(results, r)
      }
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

func ParseSchedule(path string) []ScheduleParserResult {
  results := make([]ScheduleParserResult, 0)
  filepath.Walk(path, func(path string, file os.FileInfo, err error) error{
    rs := parseFile(path)
    if len(rs) > 0 {
      results = append(results, rs...)
    }
    return nil
  })
  return results
}
