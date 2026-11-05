package factories

import (
	"constructora/backend/database"
	"constructora/backend/models"
	"fmt"
	"net/mail"
	"strings"
	"unicode/utf8"
)

type ValidationError struct{ Message string }

func (e *ValidationError) Error() string { return e.Message }

type Validator interface {
	Validate(models.Draft) (models.Draft, error)
}
type ClientValidator struct{}
type ProjectValidator struct{}

func common(d models.Draft) (models.Draft, error) {
	d.Name = strings.TrimSpace(d.Name)
	d.Detail = strings.TrimSpace(d.Detail)
	d.Kind = strings.TrimSpace(d.Kind)
	d.Status = strings.TrimSpace(d.Status)
	if d.Name == "" || d.Detail == "" || d.Kind == "" || d.Status == "" {
		return d, &ValidationError{"name, detail, kind y status son obligatorios"}
	}
	if utf8.RuneCountInString(d.Name) > 100 || utf8.RuneCountInString(d.Detail) > 160 {
		return d, &ValidationError{"name máximo 100 caracteres; detail máximo 160"}
	}
	return d, nil
}
func (ClientValidator) Validate(d models.Draft) (models.Draft, error) {
	d, err := common(d)
	if err != nil {
		return d, err
	}
	if d.Kind != "Persona" && d.Kind != "Empresa" {
		return d, &ValidationError{"kind debe ser Persona o Empresa"}
	}
	if d.Status != "Activo" && d.Status != "Inactivo" {
		return d, &ValidationError{"status debe ser Activo o Inactivo"}
	}
	address, err := mail.ParseAddress(d.Detail)
	if err != nil || address.Address != d.Detail || !strings.Contains(strings.SplitN(d.Detail, "@", 2)[1], ".") {
		return d, &ValidationError{"detail debe ser un correo válido"}
	}
	return d, nil
}
func (ProjectValidator) Validate(d models.Draft) (models.Draft, error) {
	d, err := common(d)
	if err != nil {
		return d, err
	}
	initial := "Planificación"
	if d.Kind == "Comercial" {
		initial = "Evaluación"
	} else if d.Kind != "Residencial" {
		return d, &ValidationError{"kind debe ser Residencial o Comercial"}
	}
	if d.Status != initial && d.Status != "En ejecución" && d.Status != "Entregada" {
		return d, &ValidationError{fmt.Sprintf("status debe ser %s, En ejecución o Entregada", initial)}
	}
	return d, nil
}

type ModuleFactory interface {
	CreateRepository() database.Repository
	CreateValidator() Validator
	CreateCreator() Creator
}
type ClientFactory struct{ Store *database.Store }

func (f ClientFactory) CreateRepository() database.Repository { return f.Store.Repository("clientes") }
func (ClientFactory) CreateValidator() Validator              { return ClientValidator{} }
func (ClientFactory) CreateCreator() Creator                  { return ClientCreator{} }

type ProjectFactory struct{ Store *database.Store }

func (f ProjectFactory) CreateRepository() database.Repository { return f.Store.Repository("obras") }
func (ProjectFactory) CreateValidator() Validator              { return ProjectValidator{} }
func (ProjectFactory) CreateCreator() Creator                  { return ProjectCreator{} }
