package store

import (
  "os"
  "log"
  "github.com/gin-gonic/gin"
  "github.com/google/uuid"
  "go-webapp/pkg/file"
)

type Page struct {
  Id string `json:"id"`
  User string `json:"user"`
  Body string `json:"body"`
  Meta map[string]interface{} `json:"meta"`
}
type ImgId struct {
  ImgId string `json:"imgId"`
  User string `json:"user"`
}
type CheckResponse struct {
  Editable bool `json:"editable"`
  Login bool `json:"login"`
  User string `json:"user"`
}

type SearchScheduleResponse struct {
  Lines []file.SearchScheduleResult `json:"lines"`
}


func AttachSearch(r *gin.Engine) {
  r.OPTIONS("/search", func(c *gin.Context){
    c.String(200, "OK")
  })
  r.POST("/search", func(c *gin.Context){
    keyword := c.PostForm("keyword")
    user := c.PostForm("user")
    noCache := c.PostForm("noCache")

    if(noCache != "1"){
      // check chache
      fname := file.GetSearchFileName(user, keyword)
      if _, err := os.Stat(fname); err == nil{
        // cache hit
        c.File(fname);
        return
      }
    }
    result, err := file.Search(keyword, user)
    if err != nil {
      //c.JSON(500, gin.H{"error": err.Error()})
      log.Printf("Search Save Error: %v", err)
    }
    c.JSON(200, result)
    return
  })
}

func AttachSearchSchedule(r *gin.Engine) {
  r.OPTIONS("/search-schedule", func(c *gin.Context){
    c.String(200, "OK")
  })
  r.POST("/search-schedule", func(c *gin.Context){
    lines := file.SearchSchedule()
    result := SearchScheduleResponse {
      Lines: lines,
    }
    c.JSON(200, result)
    return
  })
}

func AttachLoginCheck(r *gin.Engine) {
  r.OPTIONS("/loginCheck", func(c *gin.Context){
    c.String(200, "OK")
  })
  r.POST("/loginCheck", func(c *gin.Context){
    login := c.GetHeader("User") // TODO: not enough
    user := c.PostForm("user")

    result := CheckResponse {
      Editable: login == user,
      Login: len(login) > 0,
      User: user,
    }
    c.JSON(200, result)
    return
  })
}

func AttachImgUpdate(r *gin.Engine) {
  r.OPTIONS("/img/:user/:id", func(c *gin.Context){
    c.String(200, "OK")
  })
  r.POST("/img/:user/:id", func(c *gin.Context){
    login := c.GetHeader("User") // TODO: not enough
    user := c.Param("user")
    if(login != user){
      c.JSON(401, gin.H{"error": "login user is not page author"})
      return
    }
    id := c.Param("id")
    uuidObj,_ := uuid.NewUUID()
    imgId := uuidObj.String()

    image, _, err := c.Request.FormFile("img");
    if  err != nil{
      c.JSON(500, gin.H{"error": err.Error()})
    }

    if err := file.SaveImg(user, id, imgId, image); err != nil{
      c.JSON(500, gin.H{"error": err.Error()})
      return
    }

    result := ImgId {
      ImgId: imgId,
      User: user,
    }
    c.JSON(200, result)
    return
  })
}
func AttachImgGet(r *gin.Engine) {
  r.GET("/img/:user/:id/:imgid", func(c *gin.Context){
    user := c.Param("user")
    id := c.Param("id")
    imgId := c.Param("imgid")

    c.File(file.GetImgPath(user, id, imgId))
  })
}


func AttachUpdate(r *gin.Engine) {
  r.OPTIONS("/page/:user/:id", func(c *gin.Context){
    c.String(200, "OK")
  })
  r.POST("/page/:user/:id", func(c *gin.Context){
    login := c.GetHeader("User") // TODO: not enough
    user := c.Param("user")
    if(login != user){
      c.JSON(401, gin.H{"error": "login user is not page author"})
      return
    }
    id := c.Param("id")
    body := c.PostForm("body")
    lastUpdate := c.PostForm("lastUpdate")
    cover := c.PostForm("cover")

    nextLastUpdate, _, err := file.Save(user, id, body, lastUpdate, cover)
    if err != nil{
      c.JSON(500, gin.H{"error": err.Error()})
      return
    }else{
      result := Page {
        Id: id,
        User: user,
        Body: body,
        Meta: map[string]interface{} {
          "lastUpdate": nextLastUpdate,
          "cover": cover,
        },
      }
      c.JSON(200, result)

      file.SaveList(user);
      return
    }
  })
}
func AttachGet(r *gin.Engine) {
  r.GET("/page/:user/:id", func(c *gin.Context){
    user := c.Param("user")
    id := c.Param("id")

    if meta, body, err := file.Load(user, id); err != nil{
      c.JSON(500, gin.H{"error": err.Error()})
      return
    }else{
      result := Page {
        Id: id,
        User: user,
        Body: body,
        Meta: meta,
      }
      c.JSON(200, result)
      return
    }
  })
}
func AttachList(r *gin.Engine) {
  r.GET("/page/:user", func(c *gin.Context){
    user := c.Param("user")

    fname := file.GetListFileName(user)

    c.File(fname);
    return
  })
}
