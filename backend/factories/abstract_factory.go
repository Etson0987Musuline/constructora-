package factories

import (
	"constructora/backend/database"
	"constructora/backend/models"
	"fmt"
	"math"
	"net/mail"
	"regexp"
	"strings"
	"time"
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
	d.Document = strings.TrimSpace(d.Document)
	d.Phone = strings.TrimSpace(d.Phone)
	d.Address = strings.TrimSpace(d.Address)
	d.ClientID = strings.TrimSpace(d.ClientID)
	d.Responsible = strings.TrimSpace(d.Responsible)
	d.StartDate = strings.TrimSpace(d.StartDate)
	d.EndDate = strings.TrimSpace(d.EndDate)
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
func validateClientFields(d models.Draft) error {
	digits := "^[0-9]{8}$"
	if d.Kind == "Empresa" {
		digits = "^[0-9]{11}$"
	}
	if !regexp.MustCompile(digits).MatchString(d.Document) {
		return &ValidationError{"Persona requiere DNI de 8 dígitos; Empresa, RUC de 11 dígitos"}
	}
	if !regexp.MustCompile("^\\+?[0-9 ()-]{7,20}$").MatchString(d.Phone) {
		return &ValidationError{"Teléfono inválido (7 a 20 caracteres)"}
	}
	if strings.TrimSpace(d.Address) == "" || utf8.RuneCountInString(d.Address) > 200 {
		return &ValidationError{"Dirección obligatoria, máximo 200 caracteres"}
	}
	return nil
}
func validateProjectFields(d models.Draft) error {
	if math.IsNaN(d.Progress) || math.IsInf(d.Progress, 0) || d.Progress < 0 || d.Progress > 100 || math.Trunc(d.Progress) != d.Progress {
		return &ValidationError{"El avance debe ser un entero entre 0 y 100"}
	}
	if strings.TrimSpace(d.ClientID) == "" || strings.TrimSpace(d.Responsible) == "" || len(d.ClientID) > 200 || utf8.RuneCountInString(d.Responsible) > 200 {
		return &ValidationError{"Cliente y responsable son obligatorios, máximo 200 caracteres"}
	}
	start, err := time.Parse("2006-01-02", d.StartDate)
	if err != nil {
		return &ValidationError{"Fecha de inicio inválida"}
	}
	end, err := time.Parse("2006-01-02", d.EndDate)
	if err != nil || end.Before(start) {
		return &ValidationError{"Fecha de fin inválida o anterior al inicio"}
	}
	if math.IsNaN(d.Budget) || math.IsInf(d.Budget, 0) || d.Budget <= 0 || d.Budget > 1e12 {
		return &ValidationError{"Presupuesto debe ser mayor que cero y no superar 1 billón"}
	}
	return nil
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
	if err := validateClientFields(d); err != nil {
		return d, err
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
	if err := validateProjectFields(d); err != nil {
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
type ClientFactory struct{ Persistence PersistenceFactory }

func (f ClientFactory) CreateRepository() database.Repository {
	return f.Persistence.CreateClientsRepository()
}
func (ClientFactory) CreateValidator() Validator { return ClientValidator{} }
func (ClientFactory) CreateCreator() Creator     { return ClientCreator{} }

type ProjectFactory struct{ Persistence PersistenceFactory }

func (f ProjectFactory) CreateRepository() database.Repository {
	return f.Persistence.CreateProjectsRepository()
}
func (ProjectFactory) CreateValidator() Validator { return ProjectValidator{} }
func (ProjectFactory) CreateCreator() Creator     { return ProjectCreator{} }
