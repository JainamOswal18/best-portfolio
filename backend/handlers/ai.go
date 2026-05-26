package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	"github.com/JainamOswal18/portfolio-backend/services"
)

type askRequest struct {
	Question string `json:"question"`
}

func Ask(llm *services.LLM) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req askRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid json body"})
			return
		}
		if strings.TrimSpace(req.Question) == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "question is required", "field": "question"})
			return
		}

		c.Writer.Header().Set("Content-Type", "text/event-stream")
		c.Writer.Header().Set("Cache-Control", "no-cache")
		c.Writer.Header().Set("Connection", "keep-alive")
		c.Writer.Header().Set("X-Accel-Buffering", "no")
		c.Writer.WriteHeader(http.StatusOK)
		c.Writer.Flush()

		ctx := c.Request.Context()
		tokens := llm.Ask(ctx, req.Question)

		for tok := range tokens {
			if strings.HasPrefix(tok, "error: ") {
				payload, _ := json.Marshal(gin.H{"error": strings.TrimPrefix(tok, "error: ")})
				c.Writer.Write([]byte("event: error\ndata: " + string(payload) + "\n\n"))
				c.Writer.Flush()
				return
			}
			payload, _ := json.Marshal(gin.H{"token": tok})
			c.Writer.Write([]byte("data: " + string(payload) + "\n\n"))
			c.Writer.Flush()
		}

		c.Writer.Write([]byte("event: done\ndata: {\"done\":true}\n\n"))
		c.Writer.Flush()
	}
}

func Roast(llm *services.LLM) gin.HandlerFunc {
	return func(c *gin.Context) {
		text, err := llm.Roast(c.Request.Context())
		if err != nil {
			c.JSON(http.StatusBadGateway, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"roast": text})
	}
}

func Summarize(llm *services.LLM) gin.HandlerFunc {
	return func(c *gin.Context) {
		text, err := llm.Summarize(c.Request.Context())
		if err != nil {
			c.JSON(http.StatusBadGateway, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"summary": text})
	}
}
