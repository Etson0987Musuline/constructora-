package handlers

import (
	"constructora/backend/database"
	"constructora/backend/factories"
	"constructora/backend/models"
	"constructora/backend/services"
	"encoding/json"
	"errors"
	"io"
	"net/http"
)

func send(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if body != nil {
		_ = json.NewEncoder(w).Encode(body)
	}
}
func failure(w http.ResponseWriter, err error) {
	var validation *factories.ValidationError
	if errors.As(err, &validation) {
		send(w, 400, map[string]string{"error": validation.Error()})
	} else if errors.Is(err, database.ErrRelation) {
		send(w, 409, map[string]string{"error": err.Error()})
	} else if errors.Is(err, database.ErrNotFound) {
		send(w, 404, map[string]string{"error": err.Error()})
	} else {
		send(w, 500, map[string]string{"error": "No se pudo completar la operación de almacenamiento"})
	}
}
func Register(mux *http.ServeMux, resource string, factory factories.ModuleFactory) {
	service := services.New(factory)
	mux.HandleFunc("GET /api/"+resource, func(w http.ResponseWriter, r *http.Request) {
		rows, err := service.List(r.URL.Query().Get("q"))
		if err != nil {
			failure(w, err)
			return
		}
		send(w, 200, rows)
	})
	mux.HandleFunc("GET /api/"+resource+"/{id}", func(w http.ResponseWriter, r *http.Request) {
		row, err := service.Find(r.PathValue("id"))
		if err != nil {
			failure(w, err)
			return
		}
		send(w, 200, row)
	})
	save := func(w http.ResponseWriter, r *http.Request) {
		var draft models.Draft
		decoder := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<20))
		if err := decoder.Decode(&draft); err != nil {
			send(w, 400, map[string]string{"error": "JSON inválido"})
			return
		}
		if err := decoder.Decode(new(any)); err != io.EOF {
			send(w, 400, map[string]string{"error": "Se requiere un único objeto JSON"})
			return
		}
		id := r.PathValue("id")
		row, err := service.Save(draft, id)
		if err != nil {
			failure(w, err)
			return
		}
		status := 200
		if id == "" {
			status = 201
			w.Header().Set("Location", "/api/"+resource+"/"+row.ID)
		}
		send(w, status, row)
	}
	mux.HandleFunc("POST /api/"+resource, save)
	mux.HandleFunc("PUT /api/"+resource+"/{id}", save)
	mux.HandleFunc("DELETE /api/"+resource+"/{id}", func(w http.ResponseWriter, r *http.Request) {
		if err := service.Delete(r.PathValue("id")); err != nil {
			failure(w, err)
			return
		}
		w.WriteHeader(204)
	})
}
