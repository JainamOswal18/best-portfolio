package handlers

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/JainamOswal18/portfolio-backend/services"
)

// VisitsTrack increments the visit counter (called once per boot from the frontend).
// Returns the new count.
func VisitsTrack(kv *services.KV) gin.HandlerFunc {
	return func(c *gin.Context) {
		if !kv.Enabled() {
			c.JSON(http.StatusServiceUnavailable, gin.H{
				"error": "visit counter not configured",
				"code":  "KV_NOT_CONFIGURED",
			})
			return
		}
		n, err := kv.Incr("visits:total")
		if err != nil {
			if errors.Is(err, services.ErrKVNotConfigured) {
				c.JSON(http.StatusServiceUnavailable, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to track visit"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"count": n})
	}
}

// VisitsGet returns the current visit counter without incrementing.
func VisitsGet(kv *services.KV) gin.HandlerFunc {
	return func(c *gin.Context) {
		if !kv.Enabled() {
			c.JSON(http.StatusServiceUnavailable, gin.H{
				"error": "visit counter not configured yet",
				"code":  "KV_NOT_CONFIGURED",
			})
			return
		}
		s, err := kv.Get("visits:total")
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to read counter"})
			return
		}
		n, _ := strconv.ParseInt(s, 10, 64)
		c.JSON(http.StatusOK, gin.H{"count": n})
	}
}
