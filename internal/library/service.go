package library

type Service struct {
	store Store
}

func ProvideService(store Store) (*Service, error) {
	return &Service{store: store}, nil
}
