package main

import (
	"constructora/backend/database"
	"constructora/backend/factories"
	"constructora/backend/handlers"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"time"
)

func newRouter(file string) http.Handler {
	mux := http.NewServeMux()
	store := database.NewStore(file)
	handlers.Register(mux, "clientes", factories.ClientFactory{Store: store})
	handlers.Register(mux, "obras", factories.ProjectFactory{Store: store})
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
	server := &http.Server{Addr: ":" + port, Handler: newRouter(file), ReadHeaderTimeout: 5 * time.Second}
	log.Printf("Servidor disponible en http://localhost:%s", port)
	log.Fatal(server.ListenAndServe())
}
