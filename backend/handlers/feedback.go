package handlers

import (
	"errors"
	"log"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	"github.com/JainamOswal18/portfolio-backend/services"
)

type feedbackRequest struct {
	Message string `json:"message"`
}

func Feedback(mailer *services.Mailer) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req feedbackRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid json body"})
			return
		}
		msg := strings.TrimSpace(req.Message)
		if msg == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "feedback message cannot be empty"})
			return
		}
		if len(msg) < 3 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "feedback is too short — say a little more"})
			return
		}
		if len(msg) > 2000 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "feedback is too long (max 2000 chars)"})
			return
		}

		if err := mailer.SendFeedback(msg); err != nil {
			if errors.Is(err, services.ErrMailerNotConfigured) {
				log.Printf("[feedback:unsent] %s", msg)
				c.JSON(http.StatusServiceUnavailable, gin.H{
					"error": err.Error(),
					"code":  "MAILER_NOT_CONFIGURED",
				})
				return
			}
			log.Printf("[feedback:error] %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "failed to send feedback. try emailing jainamoswal1811@gmail.com directly.",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"ok":      true,
			"message": "Got it. Thanks for the feedback ✦",
		})
	}
}
