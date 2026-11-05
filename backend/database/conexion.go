package database

import (
	"constructora/backend/models"
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
	"sync"
)

var ErrRelation = errors.New("el cliente no existe o tiene obras asociadas")
var ErrNotFound = errors.New("registro no encontrado")

type Repository interface {
	List() ([]models.Record, error)
	Find(string) (models.Record, error)
	Save(models.Record, bool) (models.Record, error)
	Delete(string) error
}
type Store struct {
	memoryEnabled bool
	memory        map[string][]models.Record
	mu            sync.Mutex
	file          string
}

func NewMemoryStore() *Store {
	return &Store{memoryEnabled: true, memory: map[string][]models.Record{"clientes": {}, "obras": {}}}
}
func NewStore(file string) *Store { return &Store{file: file} }
func (s *Store) Repository(resource string) Repository {
	repository := &JSONRepository{store: s, resource: resource}
	if s.memoryEnabled {
		return &MemoryRepository{JSONRepository: repository}
	}
	return repository
}

type MemoryRepository struct{ *JSONRepository }
type JSONRepository struct {
	store    *Store
	resource string
}

func (s *Store) read() (map[string][]models.Record, error) {
	if s.memoryEnabled {
		raw, err := json.Marshal(s.memory)
		if err != nil {
			return nil, err
		}
		var copy map[string][]models.Record
		err = json.Unmarshal(raw, &copy)
		return copy, err
	}
	data := map[string][]models.Record{"clientes": {}, "obras": {}}
	raw, err := os.ReadFile(s.file)
	if errors.Is(err, os.ErrNotExist) {
		return data, nil
	}
	if err != nil {
		return nil, err
	}
	if err := json.Unmarshal(raw, &data); err != nil {
		return nil, err
	}
	if data == nil {
		return nil, errors.New("almacenamiento inválido")
	}
	return data, nil
}
func (s *Store) write(data map[string][]models.Record) error {
	if s.memoryEnabled {
		s.memory = data
		return nil
	}
	if err := os.MkdirAll(filepath.Dir(s.file), 0755); err != nil {
		return err
	}
	raw, err := json.MarshalIndent(data, "", "  ")
	if err != nil {
		return err
	}
	tmp, err := os.CreateTemp(filepath.Dir(s.file), "records-*.tmp")
	if err != nil {
		return err
	}
	defer os.Remove(tmp.Name())
	if _, err = tmp.Write(raw); err != nil {
		tmp.Close()
		return err
	}
	if err = tmp.Close(); err != nil {
		return err
	}
	return os.Rename(tmp.Name(), s.file)
}
func (r *JSONRepository) List() ([]models.Record, error) {
	r.store.mu.Lock()
	defer r.store.mu.Unlock()
	data, err := r.store.read()
	if err != nil {
		return nil, err
	}
	rows := data[r.resource]
	if rows == nil {
		rows = []models.Record{}
	}
	return rows, nil
}
func (r *JSONRepository) Find(id string) (models.Record, error) {
	rows, err := r.List()
	if err != nil {
		return models.Record{}, err
	}
	for _, row := range rows {
		if row.ID == id {
			return row, nil
		}
	}
	return models.Record{}, ErrNotFound
}
func (r *JSONRepository) Save(row models.Record, replace bool) (models.Record, error) {
	r.store.mu.Lock()
	defer r.store.mu.Unlock()
	data, err := r.store.read()
	if err != nil {
		return models.Record{}, err
	}
	if r.resource == "obras" {
		found := false
		for _, client := range data["clientes"] {
			if client.ID == row.ClientID {
				found = true
				break
			}
		}
		if !found {
			return models.Record{}, ErrRelation
		}
	}
	if replace {
		found := false
		for i, old := range data[r.resource] {
			if old.ID == row.ID {
				data[r.resource][i] = row
				found = true
				break
			}
		}
		if !found {
			return models.Record{}, ErrNotFound
		}
	} else {
		data[r.resource] = append(data[r.resource], row)
	}
	if err := r.store.write(data); err != nil {
		return models.Record{}, err
	}
	return row, nil
}
func (r *JSONRepository) Delete(id string) error {
	r.store.mu.Lock()
	defer r.store.mu.Unlock()
	data, err := r.store.read()
	if err != nil {
		return err
	}
	for i, row := range data[r.resource] {
		if row.ID == id {
			if r.resource == "clientes" {
				for _, project := range data["obras"] {
					if project.ClientID == id {
						return ErrRelation
					}
				}
			}
			data[r.resource] = append(data[r.resource][:i], data[r.resource][i+1:]...)
			return r.store.write(data)
		}
	}
	return ErrNotFound
}
