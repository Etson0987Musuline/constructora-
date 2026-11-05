package main

import (
	"constructora/backend/factories"
	"constructora/backend/handlers"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"time"
)

func newRouter(file string) http.Handler {
	return routerWithFactory(factories.NewJSONPersistenceFactory(file))
}
func routerWithFactory(family factories.PersistenceFactory) http.Handler {
	mux := http.NewServeMux()
	handlers.Register(mux, "clientes", factories.ClientFactory{Persistence: family})
	handlers.Register(mux, "obras", factories.ProjectFactory{Persistence: family})
	mux.HandleFunc("GET /api/salud", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]string{"mensaje": "Backend de constructora funcionando"})
	})
	return mux
}
func main() {
	file := os.Getenv("CONSTRUCTORA_DATA_FILE")
	if file == "" {
		file = "data/records.json"
	}
	port := os.Getenv("PORT")
	if port == "" {
		port = "8081"
	}
	var router http.Handler
	switch os.Getenv("CONSTRUCTORA_STORAGE") {
	case "", "json":
		router = newRouter(file)
	case "memory":
		router = routerWithFactory(factories.NewMemoryPersistenceFactory())
	default:
		log.Fatal("CONSTRUCTORA_STORAGE debe ser json o memory")
	}
	server := &http.Server{Addr: ":" + port, Handler: router, ReadHeaderTimeout: 5 * time.Second}
	log.Printf("Servidor disponible en http://localhost:%s", port)
	log.Fatal(server.ListenAndServe())
}
