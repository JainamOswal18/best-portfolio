package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/JainamOswal18/portfolio-backend/services"
)

const (
	guestbookKey    = "guestbook:entries"
	guestbookMaxLen = 200 // keep most recent 200 entries
)

type guestbookEntry struct {
	Name      string `json:"name,omitempty"`
	Message   string `json:"message"`
	Timestamp string `json:"ts"`
}

type guestbookRequest struct {
	Name    string `json:"name"`
	Message string `json:"message"`
}

func GuestbookList(kv *services.KV) gin.HandlerFunc {
	return func(c *gin.Context) {
		if !kv.Enabled() {
			c.JSON(http.StatusServiceUnavailable, gin.H{
				"error": "guestbook is not wired yet",
				"code":  "KV_NOT_CONFIGURED",
			})
			return
		}
		raw, err := kv.LRange(guestbookKey, 30)
		if err != nil {
			if errors.Is(err, services.ErrKVNotConfigured) {
				c.JSON(http.StatusServiceUnavailable, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to read guestbook"})
			return
		}
		entries := make([]guestbookEntry, 0, len(raw))
		for _, item := range raw {
			var e guestbookEntry
			if err := json.Unmarshal([]byte(item), &e); err != nil {
				continue
			}
			entries = append(entries, e)
		}
		c.JSON(http.StatusOK, gin.H{"entries": entries})
	}
}

func GuestbookAdd(kv *services.KV) gin.HandlerFunc {
	return func(c *gin.Context) {
		if !kv.Enabled() {
			c.JSON(http.StatusServiceUnavailable, gin.H{
				"error": "guestbook is not wired yet",
				"code":  "KV_NOT_CONFIGURED",
			})
			return
		}
		var req guestbookRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid json body"})
			return
		}
		name := strings.TrimSpace(req.Name)
		msg := strings.TrimSpace(req.Message)

		if msg == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "message cannot be empty"})
			return
		}
		if len(msg) < 3 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "say a little more — at least 3 characters"})
			return
		}
		if len(msg) > 280 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "max 280 characters (Twitter-length)"})
			return
		}
		if len(name) > 60 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "name max 60 characters"})
			return
		}

		entry := guestbookEntry{
			Name:      name,
			Message:   msg,
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		}
		raw, _ := json.Marshal(entry)
		if err := kv.LPushTrim(guestbookKey, string(raw), guestbookMaxLen); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save entry"})
			return
		}
		c.JSON(http.StatusOK, gin.H{
			"ok":      true,
			"message": "signed ✦ thanks for stopping by",
		})
	}
}
