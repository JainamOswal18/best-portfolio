package handler

import (
	"net/http"

	"github.com/JainamOswal18/portfolio-backend/internal/app"
)

var engine = app.Build()

func Handler(w http.ResponseWriter, r *http.Request) {
	engine.ServeHTTP(w, r)
}
