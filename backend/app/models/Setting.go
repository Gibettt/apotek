package models

type Setting struct {
	ID    int    `json:"id"`
	Key   string `json:"key"`
	Value string `json:"value"`
	Group string `json:"group"`
	Label string `json:"label"`
}
