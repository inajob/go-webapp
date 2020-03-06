run:
	go run cmd/server/main.go

build:
	go build -o server cmd/server/main.go

test:
	go test pkg/server

debug:
	realize start

deps:
	go get gopkg.in/urfave/cli.v2@master
	go get github.com/oxequa/realize
