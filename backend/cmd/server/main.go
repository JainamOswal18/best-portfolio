package main

import (
	"log"
	"os"

	"github.com/joho/godotenv"

	"github.com/JainamOswal18/portfolio-backend/internal/app"
)

func main() {
	_ = godotenv.Load()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	engine := app.Build()
	log.Printf("portfolio backend listening on :%s", port)
	if err := engine.Run(":" + port); err != nil {
		log.Fatalf("server exited: %v", err)
	}
}
