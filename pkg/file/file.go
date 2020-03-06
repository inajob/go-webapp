package file

import (
  "os"
  "io"
  "io/ioutil"
  "path/filepath"
  "mime/multipart"
)

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


func Save (user string, id string, body string) (err error) {
  dirPath := filepath.Join(CONTENTS_DIR, user)
  if _, err := os.Stat(dirPath); err != nil{
    if err := os.Mkdir(dirPath, 0775); err != nil{
      return err
    }
  }
  if err := ioutil.WriteFile(filepath.Join(CONTENTS_DIR, user, id), []byte(body), 0644); err != nil {
    return err
  }
  return nil
}

func Load (user string, id string) (body []byte, err error) {
  var bytes []byte
  if bytes, err = ioutil.ReadFile(filepath.Join(CONTENTS_DIR, user, id)); err != nil {
    return nil, err
  }
  return bytes, nil
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
