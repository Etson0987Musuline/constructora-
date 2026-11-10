FROM golang:1.27-bookworm AS build
WORKDIR /src
COPY go.mod ./
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /server .

FROM alpine:3.22
RUN apk add --no-cache ca-certificates && addgroup -g 10001 app && adduser -D -u 10001 -G app app && mkdir -p /data && chown app:app /data
COPY --from=build /server /server
USER app
ENV PORT=8081 CONSTRUCTORA_STORAGE=json CONSTRUCTORA_DATA_FILE=/data/records.json
EXPOSE 8081
CMD ["/server"]
