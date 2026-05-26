package handlers

import (
	"errors"
	"log"
	"net/http"
	"regexp"
	"strings"

	"github.com/gin-gonic/gin"

	"github.com/JainamOswal18/portfolio-backend/services"
)

var emailRegex = regexp.MustCompile(`^[^\s@]+@[^\s@]+\.[^\s@]+$`)

type contactRequest struct {
	Name    string `json:"name"`
	Email   string `json:"email"`
	Message string `json:"message"`
}

func Contact(mailer *services.Mailer) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req contactRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid json body"})
			return
		}
		req.Name = strings.TrimSpace(req.Name)
		req.Email = strings.TrimSpace(req.Email)
		req.Message = strings.TrimSpace(req.Message)

		if req.Name == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "name is required", "field": "name"})
			return
		}
		if !emailRegex.MatchString(req.Email) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "email is invalid", "field": "email"})
			return
		}
		if len(req.Message) < 10 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "message must be at least 10 characters", "field": "message"})
			return
		}

		if err := mailer.SendContact(req.Name, req.Email, req.Message); err != nil {
			if errors.Is(err, services.ErrMailerNotConfigured) {
				log.Printf("[contact:unsent] %s <%s>: %s", req.Name, req.Email, req.Message)
				c.JSON(http.StatusServiceUnavailable, gin.H{
					"error": err.Error(),
					"code":  "MAILER_NOT_CONFIGURED",
				})
				return
			}
			log.Printf("[contact:error] %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "failed to deliver message. try emailing jainamoswal1811@gmail.com directly.",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"ok":      true,
			"message": "Message delivered. Jainam will get back to you soon.",
		})
	}
}
