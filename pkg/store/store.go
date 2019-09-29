package store

import (
  "github.com/gin-gonic/gin"
  "go-webapp/pkg/file"
)

type Page struct {
  Id string `json:"id"`
  User string `json:"user"`
  Body string `json:"body"`
}

func AttachUpdate(r *gin.Engine) {
  r.POST("/page/:user/:id", func(c *gin.Context){
    user := c.Param("user")
    id := c.Param("id")

    body := c.PostForm("body")

    if err := file.Save(user, id, body); err != nil{
      c.JSON(500, gin.H{"error": err.Error()})
    }else{
      result := Page {
        Id: id,
        User: user,
        Body: body,
      }
      c.JSON(200, result)
    }
  })
}
func AttachGet(r *gin.Engine) {
  r.GET("/page/:user/:id", func(c *gin.Context){
    user := c.Param("user")
    id := c.Param("id")

    if body,err := file.Load(user, id); err != nil{
      c.JSON(500, gin.H{"error": err.Error()})
    }else{
      result := Page {
        Id: id,
        User: user,
        Body: string(body),
      }
      c.JSON(200, result)
    }
  })
}
