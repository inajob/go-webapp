run:
	go run cmd/server/main.go

build:
	go build -o server cmd/server/main.go

build-backend-image:
	docker build -t kinadu/go-webapp-backend .

push-backend-image: build-backend-image
	docker push kinadu/go-webapp-backend

build-frontend-image:
	docker build -t kinadu/go-webapp-frontend ./react-app

push-frontend-image: build-frontend-image
	docker push kinadu/go-webapp-frontend

test:
	go test pkg/server

debug:
	realize start

deps:
	go get gopkg.in/urfave/cli.v2@master
	go get github.com/oxequa/realize
