package services

import (
	"constructora/backend/database"
	"constructora/backend/factories"
	"constructora/backend/models"
	"strings"
)

type CRUD struct {
	repository database.Repository
	validator  factories.Validator
	creator    factories.Creator
}

func New(factory factories.ModuleFactory) *CRUD {
	return &CRUD{repository: factory.CreateRepository(), validator: factory.CreateValidator(), creator: factory.CreateCreator()}
}
func (s *CRUD) List(query string) ([]models.Record, error) {
	rows, err := s.repository.List()
	if err != nil {
		return nil, err
	}
	result := []models.Record{}
	for _, r := range rows {
		if strings.Contains(strings.ToLower(r.Name+" "+r.Detail+" "+r.Kind+" "+r.Status), strings.ToLower(query)) {
			result = append(result, r)
		}
	}
	return result, nil
}
func (s *CRUD) Find(id string) (models.Record, error) { return s.repository.Find(id) }
func (s *CRUD) Save(draft models.Draft, id string) (models.Record, error) {
	draft, err := s.validator.Validate(draft)
	if err != nil {
		return models.Record{}, err
	}
	row, err := factories.Create(s.creator, draft)
	if err != nil {
		return models.Record{}, err
	}
	if id != "" {
		row.ID = id
	}
	return s.repository.Save(row, id != "")
}
func (s *CRUD) Delete(id string) error { return s.repository.Delete(id) }
