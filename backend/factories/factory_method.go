package factories

import (
	"constructora/backend/models"
	"crypto/rand"
	"encoding/hex"
)

type Product interface {
	Build(models.Draft) (models.Record, error)
}
type ClientProduct struct{}

func (ClientProduct) Build(d models.Draft) (models.Record, error) { return build(d) }

type ProjectProduct struct{}

func (ProjectProduct) Build(d models.Draft) (models.Record, error) { return build(d) }
func build(d models.Draft) (models.Record, error) {
	var id [16]byte
	if _, err := rand.Read(id[:]); err != nil {
		return models.Record{}, err
	}
	return models.Record{ID: hex.EncodeToString(id[:]), Draft: d}, nil
}

type Creator interface{ FactoryMethod() Product }
type ClientCreator struct{}

func (ClientCreator) FactoryMethod() Product { return ClientProduct{} }

type ProjectCreator struct{}

func (ProjectCreator) FactoryMethod() Product { return ProjectProduct{} }

func Create(creator Creator, draft models.Draft) (models.Record, error) {
	return creator.FactoryMethod().Build(draft)
}
