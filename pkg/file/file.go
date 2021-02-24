package file

import (
  "encoding/json"
  "fmt"
  "errors"
  "os"
  "io"
  "io/ioutil"
  "strings"
  "strconv"
  "time"
  "path/filepath"
  "mime/multipart"
  "github.com/inajob/frontmatter"
)

type SearchResult struct {
  User string `json:"user"`
  Id string `json:"id"`
  LineNo int `json:"lineNo"`
  Text string `json:"text"`
  Cover string `json:"cover"`
}

type SearchScheduleResult struct {
  User string `json:"user"`
  Id string `json:"id"`
  LineNo int `json:"lineNo"`
  Text string `json:"text"`
  Cover string `json:"cover"`
  Schedule time.Time `json:"schedule"`
}
type PageList struct {
  Pages []string `json:"pages"`
}


var CONTENTS_DIR = filepath.Join("data/contents") // TODO: only support 1 depth dir
var IMG_DIR = filepath.Join("data/imgs")

func SaveImg(user string, id string, imgId string, image multipart.File) (err error){
  dirPath := filepath.Join(IMG_DIR, user, id)
  if _, err := os.Stat(dirPath); err != nil{
    if err := os.MkdirAll(dirPath, 0775); err != nil{
      return err
    }
  }

  // todo: extension
  saveFile, err := os.Create(GetImgPath(user, id, imgId))
  if err != nil {
    return err
  }

  defer saveFile.Close()
  io.Copy(saveFile, image)

  return
}

func GetImgPath(user string, id string, imgId string) (path string){
  return filepath.Join(IMG_DIR, user, id, imgId)
}

func Search(keyword string) []SearchResult{
  gr := Grep(CONTENTS_DIR, keyword)
  r := make([]SearchResult, len(gr))
  for i := 0; i < len(gr); i ++ {
    path := strings.Split(gr[i].Path, string(os.PathSeparator))
    cover, _ := gr[i].Meta["cover"]
    scover, _ := cover.(string)
    r[i] = SearchResult {
      User: path[len(path) - 2],
      Id: path[len(path) - 1],
      LineNo: gr[i].LineNo,
      Text: gr[i].Text,
      Cover: scover,
    }
  }
  return r
}

func SearchSchedule() []SearchScheduleResult{
  gr := ParseSchedule(CONTENTS_DIR)
  r := make([]SearchScheduleResult, len(gr))
  for i := 0; i < len(gr); i ++ {
    path := strings.Split(gr[i].Path, string(os.PathSeparator))
    cover, _ := gr[i].Meta["cover"]
    scover, _ := cover.(string)
    r[i] = SearchScheduleResult {
      User: path[len(path) - 2],
      Id: path[len(path) - 1],
      LineNo: gr[i].LineNo,
      Text: gr[i].Text,
      Cover: scover,
    }
  }
  return r
}

func Save (user string, id string, body string, lastUpdate string, cover string) (nextLastUpdate string, isNewFile bool, err error) {
  dirPath := filepath.Join(CONTENTS_DIR, user)
  if _, err := os.Stat(dirPath); err != nil{
    if err := os.Mkdir(dirPath, 0775); err != nil{
      return "", false, err
    }
  }
  isNewFile = false;
  filePath := filepath.Join(CONTENTS_DIR, user, id)
  if _, err := os.Stat(filePath); err != nil{
    // file not found
    isNewFile = true;
  }else{
    // file found
    meta, _, err := Load(user, id)
    if err != nil {
      return "", false, err
    }
    l, ok := meta["lastUpdate"]
    if ok {
      if lastUpdate != l {
        return "", false, errors.New("lastUpdate mismatch")
      }
    }else{
      fmt.Printf("lastUpdate: not found in document\n")
    }
  }

  now := time.Now().Unix()
  n := strconv.FormatInt(now, 10)
  body = "---\nlastUpdate: \"" + n + "\"\ncover: \""+ cover +"\"\n---\n" + body
  if err := ioutil.WriteFile(filePath, []byte(body), 0644); err != nil {
    return "", false, err
  }
  return n, isNewFile, nil
}

func Load (user string, id string) (meta map[string]interface{}, body string, err error) {
  fp, err := os.Open(filepath.Join(CONTENTS_DIR, user, id))
  if err != nil {
    return nil, "", err
  }
  defer fp.Close()

  meta, body, err = frontmatter.ParseFrontMatter(fp)
  if err != nil{
    return nil, "", err
  }

  return meta, body, nil
}

func GetListFileName(user string) (string){
  return filepath.Join(CONTENTS_DIR, user + "-files.json")
}

func SaveList(user string) (err error){
  fname := GetListFileName(user);
  fs, err := List(user)
  if err != nil {
    return err
  }
  result := PageList {
    Pages: fs,
  }
  data, err := json.Marshal(result)
  if err != nil {
    return err
  }

  return ioutil.WriteFile(fname, data, 0644)
}

func List (user string) (files []string, err error) {
  dirPath := filepath.Join(CONTENTS_DIR, user)
  fs, err := ioutil.ReadDir(dirPath)
  if err != nil {
    return nil, err
  }
  var l []string

  for _, f := range fs {
    l = append(l, f.Name());
  }
  return l, nil
}
