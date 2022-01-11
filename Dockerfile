FROM golang:1.13 as builder
WORKDIR /go/src/github.com/inajob/go-webapp

COPY ./cmd ./cmd
COPY ./pkg ./pkg
COPY go.mod ./
COPY go.sum ./
COPY Makefile ./

ENV CGO_ENABLED=0
#ENV GOOS=linux
#ENV GOARCH=amd64

RUN make build

FROM scratch

COPY --from=builder /go/src/github.com/inajob/go-webapp/server /server
COPY ./web /web

ENTRYPOINT ["/server"]


