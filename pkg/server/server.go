package server

import (
  "os"
  "log"
  "net/http"
  "github.com/gin-gonic/gin"
  "go-webapp/pkg/store"
  "go-webapp/pkg/file"
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
    origin := os.Getenv("ALLOW_ORIGIN")
    c.Writer.Header().Set("Access-Control-Allow-Origin", origin);
    // for debug
    c.Writer.Header().Set("Access-Control-Allow-Headers","User,Content-type,Accept");
    // for send cookie from another origin(danger!)
    c.Writer.Header().Set("Access-Control-Allow-Credentials","true");
  }
}

func AttachFileServer(r *gin.Engine) {
  fs := http.Dir("web")
  fileServer :=http.StripPrefix("/test/", http.FileServer(fs))
  r.GET("/test/*filepath", func(c *gin.Context){
    filePath := c.Param("filepath")
    log.Println(filePath)
    if filePath == "/" {
      //c.String(200, "index")
      id := c.Query("id")
      user := c.Query("user")
      body,_ := file.Load(user, id)
      c.HTML(http.StatusOK, "index.html", gin.H{
        "body": string(body),
      })
    }else{
      f, err := fs.Open(filePath)
      if err != nil {
        c.Writer.WriteHeader(http.StatusNotFound)
        return
      }
      f.Close()
      fileServer.ServeHTTP(c.Writer, c.Request)
    }
  })
}

func Serve() {
  r := gin.Default()
  r.Use(addHeader())

  r.LoadHTMLGlob("web/index.html")
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
  AttachFileServer(r);
  store.AttachLoginCheck(r);
  store.AttachImgUpdate(r);
  store.AttachImgGet(r);
  store.AttachUpdate(r);
  store.AttachGet(r);
  store.AttachList(r);

  r.Run(":8088");
}
