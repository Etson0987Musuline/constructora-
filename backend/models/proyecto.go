package models

type Draft struct {
	Progress    float64 `json:"progress"`
	Document    string  `json:"document,omitempty"`
	Phone       string  `json:"phone,omitempty"`
	Address     string  `json:"address,omitempty"`
	ClientID    string  `json:"clientId,omitempty"`
	Responsible string  `json:"responsible,omitempty"`
	StartDate   string  `json:"startDate,omitempty"`
	EndDate     string  `json:"endDate,omitempty"`
	Budget      float64 `json:"budget,omitempty"`
	Name        string  `json:"name"`
	Detail      string  `json:"detail"`
	Kind        string  `json:"kind"`
	Status      string  `json:"status"`
}
type Record struct {
	ID string `json:"id"`
	Draft
}
