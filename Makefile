run:
	go run cmd/server/main.go

local-run:
	ALLOW_ORIGIN=http://localhost:3000 go run cmd/server/main.go

build:
	go build -o server cmd/server/main.go

buildweb:
	cd react-app &&  REACT_APP_API_SERVER="" yarn run build

build-backend: buildweb
	docker build -t inajob1/go-webapp-backend .

push-backend: build-backend
	#docker push inajob1/go-webapp-backend
	docker buildx build --platform linux/amd64,linux/arm64 -t inajob1/go-webapp-backend --push .

deploy: push-backend
	kubectl rollout restart -n inline-editor deployment go-webapp-backend

build-frontend:
	docker build -t inajob1/go-webapp-frontend ./react-app

push-frontend: build-frontend
	docker push inajob1/go-webapp-frontend

test:
	go test pkg/server

debug:
	realize start

deps:
	go get gopkg.in/urfave/cli.v2@master
	go get github.com/oxequa/realize
