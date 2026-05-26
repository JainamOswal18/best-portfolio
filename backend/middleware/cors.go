package middleware

import (
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func CORS(frontendURL string) gin.HandlerFunc {
	return cors.New(cors.Config{
		AllowOrigins:     []string{frontendURL},
		AllowMethods:     []string{"GET", "POST", "OPTIONS"},
		AllowHeaders:     []string{"Content-Type"},
		ExposeHeaders:    []string{"Content-Type", "Content-Disposition"},
		AllowCredentials: false,
		MaxAge:           12 * time.Hour,
	})
}
