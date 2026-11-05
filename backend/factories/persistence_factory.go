package factories

import "constructora/backend/database"

// RepositoryCreator is the Go equivalent of the factory-method creator contract.
type RepositoryCreator interface {
	FactoryMethod(resource string) database.Repository
}
type JSONRepositoryCreator struct{ Store *database.Store }

func (c JSONRepositoryCreator) FactoryMethod(resource string) database.Repository {
	return c.Store.Repository(resource)
}

type MemoryRepositoryCreator struct{ Store *database.Store }

func (c MemoryRepositoryCreator) FactoryMethod(resource string) database.Repository {
	return c.Store.Repository(resource)
}
func CreateRepository(creator RepositoryCreator, resource string) database.Repository {
	return creator.FactoryMethod(resource)
}

// PersistenceFactory supplies related repositories sharing one storage environment.
type PersistenceFactory interface {
	CreateClientsRepository() database.Repository
	CreateProjectsRepository() database.Repository
}
type JSONPersistenceFactory struct{ creator JSONRepositoryCreator }

func NewJSONPersistenceFactory(file string) *JSONPersistenceFactory {
	return &JSONPersistenceFactory{creator: JSONRepositoryCreator{Store: database.NewStore(file)}}
}
func (f *JSONPersistenceFactory) CreateClientsRepository() database.Repository {
	return CreateRepository(f.creator, "clientes")
}
func (f *JSONPersistenceFactory) CreateProjectsRepository() database.Repository {
	return CreateRepository(f.creator, "obras")
}

type MemoryPersistenceFactory struct{ creator MemoryRepositoryCreator }

func NewMemoryPersistenceFactory() *MemoryPersistenceFactory {
	return &MemoryPersistenceFactory{creator: MemoryRepositoryCreator{Store: database.NewMemoryStore()}}
}
func (f *MemoryPersistenceFactory) CreateClientsRepository() database.Repository {
	return CreateRepository(f.creator, "clientes")
}
func (f *MemoryPersistenceFactory) CreateProjectsRepository() database.Repository {
	return CreateRepository(f.creator, "obras")
}
