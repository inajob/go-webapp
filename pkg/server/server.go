package server

import (
  "log"
  "net/http"
  "github.com/gin-gonic/gin"
  "go-webapp/pkg/store"
)

type Health struct {
  Status string `json:"status"`
}
type CheckResponse struct {
  Login string `json:"login"`
}

func addHeader() gin.HandlerFunc {
  return func(c *gin.Context){
    log.Println("here is Header middleware")
    // for debug
    c.Writer.Header().Set("Access-Control-Allow-Origin","*");
    // for debug
    c.Writer.Header().Set("Access-Control-Allow-Headers","User,Content-type,Accept");
  }
}

func Serve() {
  r := gin.Default()
  r.Use(addHeader())

  r.StaticFS("/web", http.Dir("web"))

  r.GET("/healthz", func(c *gin.Context){
    result := Health {
      Status: "ok",
    }
    c.JSON(200, result)
  })

  r.POST("/check", func(c *gin.Context){
    login := c.GetHeader("User") // TODO: not enough
    result := CheckResponse {
      Login: login,
    }
    c.JSON(200, result)
  })


  // register entrypoint
  store.AttachUpdate(r);
  store.AttachGet(r);
  store.AttachList(r);

  r.Run(":8088");
}
