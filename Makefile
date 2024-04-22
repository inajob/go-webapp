run:
	go run cmd/server/main.go

run-frontend:
	cd react-app && yarn start

local-run:
	ALLOW_ORIGIN=http://localhost:3000 go run cmd/server/main.go
local-run2:
	ALLOW_ORIGIN=http://localhost:5173 go run cmd/server/main.go

lan-run:
	ALLOW_ORIGIN=http://192.168.1.16:3000 REACT_APP_API_SERVER="http://192.168.1.16:8088" go run cmd/server/main.go

build:
	go build -o server cmd/server/main.go

buildweb:
	cd react-app &&  REACT_APP_API_SERVER="" yarn run build

buildngweb:
	cd ng-front &&  VITE_API_SERVER="" npm run build

build-backend: buildweb buildngweb
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
