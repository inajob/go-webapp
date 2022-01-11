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

type SearchResponse struct {
  Lines []SearchResult `json:"lines"`
}

type SearchScheduleResult struct {
  User string `json:"user"`
  Id string `json:"id"`
  LineNo int `json:"lineNo"`
  Text string `json:"text"`
  Cover string `json:"cover"`
  Schedule time.Time `json:"schedule"`
}
type PageInfo struct {
  Name string `json:"name"`
  ModTime time.Time `json:"modTime"`
}
type PageList struct {
  Pages []PageInfo `json:"pages"`
}

var CONTENTS_DIR = filepath.Join("data/contents") // TODO: only support 1 depth dir
var CACHE_DIR = filepath.Join("data/cache")
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

func Search(keyword string, user string) (SearchResponse, error){
  gr := Grep(filepath.Join(CONTENTS_DIR, user), keyword)
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

  result := SearchResponse {
    Lines: r,
  }

  // save search result when bracket keyword
  if(strings.HasPrefix(keyword, "[") && strings.HasSuffix(keyword, "]")){
    fname := GetSearchFileName(user, keyword);
    dirPath := filepath.Dir(fname)

    if _, err := os.Stat(dirPath); err != nil{
      if err := os.MkdirAll(dirPath, 0775); err != nil{
        return result, err
      }
    }

    data, err := json.Marshal(result)
    if err != nil{
      return result, err
    }

    if err := ioutil.WriteFile(fname, data, 0644); err != nil{
      return result, err
    }
  }

  return result, nil
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

func Rename(user string, from string, to string) error{
  fromPath := filepath.Join(CONTENTS_DIR, user, from)
  toPath := filepath.Join(CONTENTS_DIR, user, to)
  _, err := os.Stat(toPath);
  if err == nil{
    // file exists
    return fmt.Errorf("%s exists", toPath)
  }
  if !os.IsNotExist(err){
    return fmt.Errorf("Stat error: %v", err)
  }

  err = os.Rename(fromPath, toPath)
  if err != nil {
    return fmt.Errorf("Rename error: %v", err)
  }

  fromImgDir := filepath.Join(IMG_DIR, user, from)
  toImgDir := filepath.Join(IMG_DIR, user, to)
  _, err = os.Stat(fromImgDir);
  if err == nil{
    err := os.Rename(fromImgDir, toImgDir)
    if err != nil {
      return fmt.Errorf("Img Dir Rename error: %v", err)
    }
  }else{
    if !os.IsNotExist(err){
      return fmt.Errorf("Stat error: %v", err)
    }
  }
  return nil
}

func Save (user string, id string, body string, lastUpdate string, cover string) (nextLastUpdate string, isNewFile bool, err error) {
  dirPath := filepath.Join(CONTENTS_DIR, user)
  if _, err := os.Stat(dirPath); err != nil{
    if err := os.MkdirAll(dirPath, 0775); err != nil{
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

func GetSearchFileName(user string, query string) (string){
  return filepath.Join(CACHE_DIR, user, "search", query + ".json")
}

func GetListFileName2(user string) (string){
  return filepath.Join(CACHE_DIR, user, "files2.json")
}
func GetListFileName(user string) (string){
  return filepath.Join(CACHE_DIR, user, "files2.json")
}

func SaveList(user string) (err error){
  fname := GetListFileName(user);

  dirPath := filepath.Dir(fname)
  if _, err := os.Stat(dirPath); err != nil{
    if err := os.MkdirAll(dirPath, 0775); err != nil{
      return err
    }
  }

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
  ioutil.WriteFile(GetListFileName2(user), data, 0644)
  return ioutil.WriteFile(fname, data, 0644)
}

func List (user string) (files []PageInfo, err error) {
  dirPath := filepath.Join(CONTENTS_DIR, user)
  fs, err := ioutil.ReadDir(dirPath)
  if err != nil {
    return nil, err
  }
  var l []PageInfo

  for _, f := range fs {
    l = append(l, PageInfo {
      Name: f.Name(),
      ModTime: f.ModTime(),
    });
  }
  return l, nil
}
