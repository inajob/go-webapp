run:
	go run cmd/server/main.go

build:
	go build -o server cmd/server/main.go

buildweb:
	cd react-app &&  REACT_APP_API_SERVER=http://inline.inajob.tk yarn run build

build-backend: buildweb
	docker build -t kinadu/go-webapp-backend .

push-backend: build-backend
	docker push kinadu/go-webapp-backend

deploy: push-backend
	kubectl rollout restart -n inline-editor deployment go-webapp-backend

build-frontend:
	docker build -t kinadu/go-webapp-frontend ./react-app

push-frontend: build-frontend
	docker push kinadu/go-webapp-frontend

test:
	go test pkg/server

debug:
	realize start

deps:
	go get gopkg.in/urfave/cli.v2@master
	go get github.com/oxequa/realize
