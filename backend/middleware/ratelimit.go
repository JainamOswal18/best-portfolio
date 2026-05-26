package middleware

import (
	"github.com/gin-gonic/gin"
	"github.com/ulule/limiter/v3"
	ginmw "github.com/ulule/limiter/v3/drivers/middleware/gin"
	"github.com/ulule/limiter/v3/drivers/store/memory"
)

func NewLimiter(rate string) gin.HandlerFunc {
	r, err := limiter.NewRateFromFormatted(rate)
	if err != nil {
		panic(err)
	}
	store := memory.NewStore()
	instance := limiter.New(store, r)
	return ginmw.NewMiddleware(instance)
}
