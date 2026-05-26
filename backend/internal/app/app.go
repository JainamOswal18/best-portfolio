package app

import (
	"net/http"
	"os"

	"github.com/gin-gonic/gin"

	"github.com/JainamOswal18/portfolio-backend/data"
	"github.com/JainamOswal18/portfolio-backend/handlers"
	"github.com/JainamOswal18/portfolio-backend/middleware"
	"github.com/JainamOswal18/portfolio-backend/services"
)

type Config struct {
	FrontendURL string
}

func ConfigFromEnv() Config {
	cfg := Config{FrontendURL: os.Getenv("FRONTEND_URL")}
	if cfg.FrontendURL == "" {
		cfg.FrontendURL = "http://localhost:5173"
	}
	return cfg
}

func New(cfg Config, mailer *services.Mailer, llm *services.LLM, kv *services.KV, gh *services.GitHub) *gin.Engine {
	gin.SetMode(gin.ReleaseMode)
	engine := gin.New()
	engine.Use(gin.Logger(), gin.Recovery())
	engine.Use(middleware.Security())
	engine.Use(middleware.CORS(cfg.FrontendURL))

	api := engine.Group("/api")
	{
		api.GET("/health", handlers.Health)
		api.GET("/photo", func(c *gin.Context) {
			c.Data(http.StatusOK, "image/jpeg", data.Photo())
		})
		api.GET("/init", handlers.Init)
		api.GET("/whoami", handlers.Whoami)
		api.GET("/about", handlers.About)
		api.GET("/skills", handlers.Skills)
		api.GET("/skills/:category", handlers.SkillCategory)
		api.GET("/experience", handlers.Experience)
		api.GET("/experience/:slug", handlers.ExperienceItem)
		api.GET("/community", handlers.Community)
		api.GET("/socials", handlers.Socials)
		api.GET("/resume", handlers.Resume)
		api.GET("/resume/preview", handlers.ResumePreview)
		api.GET("/summarize", handlers.Summarize(llm))
		api.GET("/visits", handlers.VisitsGet(kv))
		api.GET("/guestbook", handlers.GuestbookList(kv))
		api.GET("/contributions", handlers.Contributions(gh, kv))

		api.POST("/visits/track", middleware.NewLimiter("60-H"), handlers.VisitsTrack(kv))
		api.POST("/guestbook", middleware.NewLimiter("3-H"), handlers.GuestbookAdd(kv))
		api.POST("/contact", middleware.NewLimiter("3-H"), handlers.Contact(mailer))
		api.POST("/feedback", middleware.NewLimiter("5-H"), handlers.Feedback(mailer))
		api.POST("/ask", middleware.NewLimiter("20-H"), handlers.Ask(llm))
		api.POST("/roast", middleware.NewLimiter("20-H"), handlers.Roast(llm))
	}

	return engine
}

func Build() *gin.Engine {
	mailer := services.NewMailerFromEnv()
	llm := services.NewLLM(data.PortfolioJSON())
	kv := services.NewKVFromEnv()
	gh := services.NewGitHubFromEnv()
	return New(ConfigFromEnv(), mailer, llm, kv, gh)
}
