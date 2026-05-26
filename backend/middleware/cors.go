package middleware

import (
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

// CORS accepts FRONTEND_URL as either a single origin or a
// comma-separated list (e.g. "https://jainamoswal.xyz,https://www.jainamoswal.xyz,https://frontend-flame-three-31.vercel.app").
func CORS(frontendURL string) gin.HandlerFunc {
	var origins []string
	for _, p := range strings.Split(frontendURL, ",") {
		p = strings.TrimSpace(p)
		if p != "" {
			origins = append(origins, p)
		}
	}
	if len(origins) == 0 {
		origins = []string{"http://localhost:5173"}
	}
	return cors.New(cors.Config{
		AllowOrigins:     origins,
		AllowMethods:     []string{"GET", "POST", "OPTIONS"},
		AllowHeaders:     []string{"Content-Type"},
		ExposeHeaders:    []string{"Content-Type", "Content-Disposition"},
		AllowCredentials: false,
		MaxAge:           12 * time.Hour,
	})
}
