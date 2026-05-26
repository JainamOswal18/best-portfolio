package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/JainamOswal18/portfolio-backend/data"
)

func Resume(c *gin.Context) {
	pdf := data.ResumePDF()
	c.Header("Content-Disposition", `inline; filename="Jainam_Oswal_Resume.pdf"`)
	c.Data(http.StatusOK, "application/pdf", pdf)
}

func ResumePreview(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"preview": data.ResumePreview()})
}
