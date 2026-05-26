package handlers

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/JainamOswal18/portfolio-backend/services"
)

const (
	contribCacheKey = "contributions:graph"
	contribCacheTTL = 3600 // 1 hour — fresh enough, kind to GitHub's rate limit
)

func Contributions(gh *services.GitHub, kv *services.KV) gin.HandlerFunc {
	return func(c *gin.Context) {
		if !gh.Enabled() {
			c.JSON(http.StatusServiceUnavailable, gin.H{
				"error": "GitHub integration not configured",
				"code":  "GITHUB_NOT_CONFIGURED",
			})
			return
		}

		// Serve from cache if present
		if kv.Enabled() {
			if cached, _ := kv.Get(contribCacheKey); cached != "" {
				c.Data(http.StatusOK, "application/json", []byte(cached))
				return
			}
		}

		users := []string{"JainamOswal18", "JainamCurlScape"}
		result, err := gh.FetchContributions(users)
		if err != nil {
			if errors.Is(err, services.ErrGitHubNotConfigured) {
				c.JSON(http.StatusServiceUnavailable, gin.H{"error": err.Error()})
				return
			}
			log.Printf("[contributions:error] %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch contributions"})
			return
		}

		// Cache for next hour
		if kv.Enabled() {
			if payload, err := json.Marshal(result); err == nil {
				_ = kv.SetEx(contribCacheKey, string(payload), contribCacheTTL)
			}
		}

		c.JSON(http.StatusOK, result)
	}
}
