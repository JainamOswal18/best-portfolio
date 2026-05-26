package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/JainamOswal18/portfolio-backend/data"
)

func Health(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":    "ok",
		"timestamp": time.Now().UTC().Format(time.RFC3339),
	})
}

func Init(c *gin.Context) {
	w := data.GetWhoami()
	c.JSON(http.StatusOK, gin.H{
		"name":     w.Name,
		"tagline":  "Full Stack AI Engineer · Hackathon Junkie · Community Builder",
		"banner":   data.Banner(),
		"prompt":   "jainam@portfolio:~$",
		"commands": data.GetCommands(),
	})
}

func Whoami(c *gin.Context) {
	c.JSON(http.StatusOK, data.GetWhoami())
}

func About(c *gin.Context) {
	c.JSON(http.StatusOK, data.GetAbout())
}

func Skills(c *gin.Context) {
	c.JSON(http.StatusOK, data.GetSkills())
}

func SkillCategory(c *gin.Context) {
	cat := c.Param("category")
	items, ok := data.GetSkillCategory(cat)
	if !ok {
		c.JSON(http.StatusNotFound, gin.H{"error": "category not found", "code": "NOT_FOUND"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"category": cat, "items": items})
}

func Projects(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"projects": data.GetProjectSummaries()})
}

func Project(c *gin.Context) {
	slug := c.Param("slug")
	p, ok := data.GetProjectBySlug(slug)
	if !ok {
		c.JSON(http.StatusNotFound, gin.H{"error": "project not found", "code": "NOT_FOUND"})
		return
	}
	c.JSON(http.StatusOK, p)
}

func Experience(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"experience": data.GetExperience()})
}

func ExperienceItem(c *gin.Context) {
	slug := c.Param("slug")
	e, ok := data.GetExperienceBySlug(slug)
	if !ok {
		c.JSON(http.StatusNotFound, gin.H{"error": "experience not found", "code": "NOT_FOUND"})
		return
	}
	c.JSON(http.StatusOK, e)
}

func Community(c *gin.Context) {
	c.JSON(http.StatusOK, data.GetCommunity())
}

func Socials(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"socials": data.GetSocials()})
}
