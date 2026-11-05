package models

type Draft struct {
	Name   string `json:"name"`
	Detail string `json:"detail"`
	Kind   string `json:"kind"`
	Status string `json:"status"`
}
type Record struct {
	ID string `json:"id"`
	Draft
}
