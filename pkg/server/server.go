package server

import (
  "net/http"
  "github.com/gin-gonic/gin"
  "go-webapp/pkg/store"
)

type Health struct {
  Status string `json:"status"`
}

func Serve() {
  r := gin.Default()

  r.StaticFS("/web", http.Dir("web"))

  r.GET("/healthz", func(c *gin.Context){
    result := Health {
      Status: "ok",
    }
    c.JSON(200, result)
  })

  // register entrypoint
  store.AttachUpdate(r);
  store.AttachGet(r);

  r.Run();
}
