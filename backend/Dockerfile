# Multi-stage Dockerfile for Go Gin Backend
FROM golang:1.24-alpine AS builder

WORKDIR /app

# Download dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build statically linked binary
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o server .

# Final lean image
FROM alpine:3.20

WORKDIR /app

# Install ca-certificates and tzdata
RUN apk --no-cache add ca-certificates tzdata

COPY --from=builder /app/server /app/server

EXPOSE 8000

ENV PORT=8000 \
    GIN_MODE=release

CMD ["/app/server"]
