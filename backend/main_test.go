package main

import (
	"bytes"
	"constructora/backend/factories"
	"constructora/backend/models"
	"encoding/json"
	"fmt"
	"net/http/httptest"
	"path/filepath"
	"sync"
	"testing"
)

func TestRelatedCRUDs(t *testing.T) {
	file := filepath.Join(t.TempDir(), "records.json")
	router := newRouter(file)
	call := func(method, path, body string) *httptest.ResponseRecorder {
		t.Helper()
		w := httptest.NewRecorder()
		router.ServeHTTP(w, httptest.NewRequest(method, path, bytes.NewBufferString(body)))
		return w
	}
	client := `{"name":"Juan","detail":"juan@example.com","kind":"Persona","status":"Activo","document":"12345678","phone":"987654321","address":"Lima"}`
	if call("POST", "/api/clientes", `{}`).Code != 400 {
		t.Fatal("validation")
	}
	if call("POST", "/api/clientes", `{`).Code != 400 {
		t.Fatal("json")
	}
	w := call("POST", "/api/clientes", client)
	if w.Code != 201 {
		t.Fatalf("client %d %s", w.Code, w.Body.String())
	}
	var customer models.Record
	_ = json.Unmarshal(w.Body.Bytes(), &customer)
	project := func(id, end string, budget int) string {
		return fmt.Sprintf(`{"name":"Edificio","detail":"Lima","kind":"Residencial","status":"Planificación","clientId":%q,"responsible":"Ana","startDate":"2026-11-01","endDate":%q,"budget":%d}`, id, end, budget)
	}
	if call("POST", "/api/obras", project("missing", "2027-01-31", 1000)).Code != 409 {
		t.Fatal("missing client")
	}
	for _, body := range []string{project(customer.ID, "2026-01-01", 1000), project(customer.ID, "2027-02-30", 1000), project(customer.ID, "2027-01-31", 0)} {
		if call("POST", "/api/obras", body).Code != 400 {
			t.Fatal("project validation")
		}
	}
	w = call("POST", "/api/obras", project(customer.ID, "2027-01-31", 1000))
	if w.Code != 201 {
		t.Fatalf("project %d %s", w.Code, w.Body.String())
	}
	var work models.Record
	_ = json.Unmarshal(w.Body.Bytes(), &work)
	c := "/api/clientes/" + customer.ID
	p := "/api/obras/" + work.ID
	if call("DELETE", c, "").Code != 409 {
		t.Fatal("protected delete")
	}
	if call("PUT", p, project("missing", "2027-01-31", 1000)).Code != 409 {
		t.Fatal("protected update")
	}
	w = call("PUT", p, project(customer.ID, "2027-01-31", 2000))
	if w.Code != 200 {
		t.Fatal("update")
	}
	var updated models.Record
	_ = json.Unmarshal(w.Body.Bytes(), &updated)
	if updated.ID != work.ID || updated.Budget != 2000 {
		t.Fatal("updated data")
	}
	restored := httptest.NewRecorder()
	newRouter(file).ServeHTTP(restored, httptest.NewRequest("GET", p, nil))
	if restored.Code != 200 {
		t.Fatal("persistence")
	}
	if call("PUT", c, client).Code != 200 {
		t.Fatal("client update")
	}
	if call("GET", "/api/obras?q=missing", "").Body.String() != "[]\n" {
		t.Fatal("search")
	}
	if call("DELETE", p, "").Code != 204 || call("DELETE", c, "").Code != 204 {
		t.Fatal("delete")
	}
	if call("GET", p, "").Code != 404 || call("PUT", p, project(customer.ID, "2027-01-31", 1000)).Code != 409 {
		t.Fatal("missing")
	}
}
func TestConcurrentCreates(t *testing.T) {
	router := newRouter(filepath.Join(t.TempDir(), "records.json"))
	var group sync.WaitGroup
	for range 12 {
		group.Go(func() {
			w := httptest.NewRecorder()
			router.ServeHTTP(w, httptest.NewRequest("POST", "/api/clientes", bytes.NewBufferString(`{"name":"Cliente","detail":"test@example.com","kind":"Empresa","status":"Activo","document":"20123456789","phone":"987654321","address":"Lima"}`)))
			if w.Code != 201 {
				t.Errorf("create %d %s", w.Code, w.Body.String())
			}
		})
	}
	group.Wait()
	w := httptest.NewRecorder()
	router.ServeHTTP(w, httptest.NewRequest("GET", "/api/clientes", nil))
	var rows []models.Record
	_ = json.Unmarshal(w.Body.Bytes(), &rows)
	if len(rows) != 12 {
		t.Fatalf("lost writes %d", len(rows))
	}
}

func TestMemoryFamilyAndProgress(t *testing.T) {
	router := routerWithFactory(factories.NewMemoryPersistenceFactory())
	call := func(method, path, body string) *httptest.ResponseRecorder {
		w := httptest.NewRecorder()
		router.ServeHTTP(w, httptest.NewRequest(method, path, bytes.NewBufferString(body)))
		return w
	}
	w := call("POST", "/api/clientes", `{"name":"Juan","detail":"juan@example.com","kind":"Persona","status":"Activo","document":"12345678","phone":"987654321","address":"Lima"}`)
	if w.Code != 201 {
		t.Fatalf("client %d %s", w.Code, w.Body.String())
	}
	var client models.Record
	_ = json.Unmarshal(w.Body.Bytes(), &client)
	body := func(progress string) string {
		return fmt.Sprintf(`{"name":"Obra","detail":"Lima","kind":"Residencial","status":"En ejecución","clientId":%q,"responsible":"Ana","startDate":"2026-11-05","endDate":"2027-01-31","budget":1000,"progress":%s}`, client.ID, progress)
	}
	for _, progress := range []string{"-1", "101", "1.5"} {
		if call("POST", "/api/obras", body(progress)).Code != 400 {
			t.Fatal("invalid progress")
		}
	}
	w = call("POST", "/api/obras", body("45"))
	if w.Code != 201 {
		t.Fatalf("project %d %s", w.Code, w.Body.String())
	}
	var project models.Record
	_ = json.Unmarshal(w.Body.Bytes(), &project)
	if project.Progress != 45 {
		t.Fatal("progress")
	}
	if call("DELETE", "/api/clientes/"+client.ID, "").Code != 409 {
		t.Fatal("family integrity")
	}
	if call("PUT", "/api/obras/"+project.ID, body("100")).Code != 200 {
		t.Fatal("update progress")
	}
	if call("DELETE", "/api/obras/"+project.ID, "").Code != 204 || call("DELETE", "/api/clientes/"+client.ID, "").Code != 204 {
		t.Fatal("delete")
	}
	isolated := httptest.NewRecorder()
	routerWithFactory(factories.NewMemoryPersistenceFactory()).ServeHTTP(isolated, httptest.NewRequest("GET", "/api/clientes", nil))
	if isolated.Body.String() != "[]\n" {
		t.Fatal("isolated family")
	}
}
