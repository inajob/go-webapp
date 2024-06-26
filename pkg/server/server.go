package server

import (
	"context"
	"go-webapp/pkg/file"
	"go-webapp/pkg/store"
	"log"
	"net/http"
	"net/url"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
)

type Health struct {
	Status string `json:"status"`
}
type CheckResponse struct {
	Login string `json:"login"`
}

func addHeader() gin.HandlerFunc {
	return func(c *gin.Context) {
		log.Println("here is Header middleware")
		// for debug
		origin := os.Getenv("ALLOW_ORIGIN")
		c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
		// for debug
		c.Writer.Header().Set("Access-Control-Allow-Headers", "User,Content-type,Accept")
		// for send cookie from another origin(danger!)
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
	}
}

func AttachFileServer(r *gin.Engine) {
	origin := os.Getenv("ALLOW_ORIGIN")
	fs := http.Dir("web")
	fileServer := http.StripPrefix("/web/", http.FileServer(fs))
	r.GET("/web/*filepath", func(c *gin.Context) {
		filePath := c.Param("filepath")
		log.Println("filepath: " + filePath + "\n")
		if filePath == "/" {
			id := c.Query("id")
			user := c.Query("user")
			meta, body, _ := file.Load(user, id)
			rawDescription := []rune(string(body))
			description := ""
			if len(description) > 140 {
				description = string(rawDescription[:140]) + "..."
			} else {
				description = string(rawDescription)
			}
			description = strings.Replace(description, "\n", " ", -1)
			cover, _ := meta["cover"]
			scover, _ := cover.(string)
			if !strings.HasPrefix(scover, "http://") && !strings.HasPrefix(scover, "https://") {
				scover = origin + scover
			}

			c.HTML(http.StatusOK, "index.html", gin.H{
				"title":       id,
				"url":         origin + "/web/?user=" + url.QueryEscape(user) + "&id=" + url.QueryEscape(id),
				"description": description,
				"cover":       scover,
				"body":        string(body),
			})
		} else {
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

func AttachNgFileServer(r *gin.Engine) {
	fs := http.Dir("ng-web")
	fileServer := http.StripPrefix("/ng-web/", http.FileServer(fs))
	r.GET("/ng-web/*filepath", func(c *gin.Context) {
		filePath := c.Param("filepath")
		log.Println("filepath: " + filePath + "\n")
		f, err := fs.Open(filePath)
		if err != nil {
			c.Writer.WriteHeader(http.StatusNotFound)
			return
		}
		f.Close()
		fileServer.ServeHTTP(c.Writer, c.Request)

	})
}

func Serve() {
	r := gin.Default()
	r.Use(addHeader())

	r.LoadHTMLGlob("web/index.html")

	r.GET("/healthz", func(c *gin.Context) {
		result := Health{
			Status: "ok",
		}
		c.JSON(200, result)
	})

	r.POST("/check", func(c *gin.Context) {
		login := c.GetHeader("User") // TODO: not enough
		result := CheckResponse{
			Login: login,
		}
		c.JSON(200, result)
	})

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	go store.StartSearch(ctx)

	// register entrypoint
	AttachFileServer(r)
	AttachNgFileServer(r)
	store.AttachLoginCheck(r)
	store.AttachSearch(r)
	store.AttachSearchCache(r)
	store.AttachSearchSchedule(r)
	store.AttachImgUpdate(r)
	store.AttachImgGet(r)
	store.AttachUpdate(r)
	store.AttachGet(r)
	store.AttachList(r)
	store.AttachKeywordsList(r)
	store.AttachRename(r)
	store.AttachDelete(r)

	r.Run(":8088")
}
