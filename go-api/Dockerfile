FROM golang:1.22-alpine AS builder

WORKDIR /app

ENV CGO_ENABLED=0 \
    GOOS=linux \
    GOPROXY=https://proxy.golang.org,direct

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN go build -o /app/rem-api ./cmd/api

FROM gcr.io/distroless/static-debian12

WORKDIR /app

COPY --from=builder /app/rem-api /app/rem-api
COPY internal/db/postgres/migrations /app/internal/db/postgres/migrations

EXPOSE 8000

USER nonroot

ENTRYPOINT ["/app/rem-api"]

