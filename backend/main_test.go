package main

import (
	"bytes"
	"constructora/backend/models"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"sync"
	"testing"
)

func TestBothCRUDs(t *testing.T) {
	file := filepath.Join(t.TempDir(), "records.json")
	router := newRouter(file)
	call := func(method, path, body string) *httptest.ResponseRecorder {
		t.Helper()
		w := httptest.NewRecorder()
		router.ServeHTTP(w, httptest.NewRequest(method, path, bytes.NewBufferString(body)))
		return w
	}
	for _, resource := range []string{"clientes", "obras"} {
		t.Run(resource, func(t *testing.T) {
			kind, status, detail := "Persona", "Activo", "test@example.com"
			if resource == "obras" {
				kind, status, detail = "Comercial", "Evaluación", "Lima"
			}
			body := fmt.Sprintf(`{"name":"Prueba","detail":%q,"kind":%q,"status":%q}`, detail, kind, status)
			base := "/api/" + resource
			if w := call("POST", base, `{}`); w.Code != 400 {
				t.Fatalf("validation: %d", w.Code)
			}
			if w := call("POST", base, `{`); w.Code != 400 {
				t.Fatalf("json: %d", w.Code)
			}
			w := call("POST", base, body)
			if w.Code != 201 {
				t.Fatalf("create: %d %s", w.Code, w.Body.String())
			}
			var row models.Record
			if err := json.Unmarshal(w.Body.Bytes(), &row); err != nil {
				t.Fatal(err)
			}
			if row.ID == "" {
				t.Fatal("missing id")
			}
			single := base + "/" + row.ID
			if call("GET", single, "").Code != 200 {
				t.Fatal("read")
			}
			// A fresh router must read the persisted data.
			restored := httptest.NewRecorder()
			newRouter(file).ServeHTTP(restored, httptest.NewRequest("GET", single, nil))
			if restored.Code != 200 {
				t.Fatal("persistence")
			}
			w = call("PUT", single, body)
			if w.Code != 200 {
				t.Fatalf("update %d", w.Code)
			}
			var updated models.Record
			_ = json.Unmarshal(w.Body.Bytes(), &updated)
			if updated.ID != row.ID {
				t.Fatal("update changed id")
			}
			if w = call("GET", base+"?q=missing", ""); w.Body.String() != "[]\n" {
				t.Fatal("filter")
			}
			if call("DELETE", single, "").Code != 204 {
				t.Fatal("delete")
			}
			if call("GET", single, "").Code != 404 {
				t.Fatal("missing")
			}
			if call("PUT", single, body).Code != 404 {
				t.Fatal("update missing")
			}
		})
	}
	if call("PATCH", "/api/clientes", "").Code != http.StatusMethodNotAllowed {
		t.Fatal("method")
	}
}
func TestConcurrentCreates(t *testing.T) {
	router := newRouter(filepath.Join(t.TempDir(), "records.json"))
	var group sync.WaitGroup
	for range 12 {
		group.Go(func() {
			w := httptest.NewRecorder()
			router.ServeHTTP(w, httptest.NewRequest("POST", "/api/clientes", bytes.NewBufferString(`{"name":"Cliente","detail":"test@example.com","kind":"Empresa","status":"Activo"}`)))
			if w.Code != 201 {
				t.Errorf("create %d", w.Code)
			}
		})
	}
	group.Wait()
	w := httptest.NewRecorder()
	router.ServeHTTP(w, httptest.NewRequest("GET", "/api/clientes", nil))
	var rows []models.Record
	_ = json.Unmarshal(w.Body.Bytes(), &rows)
	if len(rows) != 12 {
		t.Fatalf("lost writes: %d", len(rows))
	}
}
