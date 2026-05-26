package services

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"
)

var ErrGitHubNotConfigured = errors.New("GitHub token not set")

type GitHub struct {
	token string
}

func NewGitHubFromEnv() *GitHub {
	return &GitHub{token: strings.TrimSpace(os.Getenv("GITHUB_TOKEN"))}
}

func (g *GitHub) Enabled() bool { return g.token != "" }

type ContribDay struct {
	Date  string `json:"date"`
	Count int    `json:"count"`
}

type Contributions struct {
	Total         int            `json:"total"`
	ActiveDays    int            `json:"active_days"`
	TopStreak     int            `json:"top_streak"`
	CurrentStreak int            `json:"current_streak"`
	Weeks         [][]ContribDay `json:"weeks"` // ordered oldest → newest; each week is 7 days Sun→Sat
	AsOf          string         `json:"as_of"`
	Accounts      []string       `json:"accounts"`
}

// FetchContributions fetches each user's contribution calendar via GraphQL,
// merges the daily counts (sum across accounts), and computes streak stats.
func (g *GitHub) FetchContributions(users []string) (*Contributions, error) {
	if !g.Enabled() {
		return nil, ErrGitHubNotConfigured
	}

	now := time.Now().UTC()
	// GitHub's contribution calendar requires `from` to be within the last year.
	from := now.AddDate(0, 0, -363)

	merged := make(map[string]int) // YYYY-MM-DD → total count
	for _, user := range users {
		days, err := g.fetchUserDays(user, from)
		if err != nil {
			return nil, fmt.Errorf("fetch %s: %w", user, err)
		}
		for date, count := range days {
			merged[date] += count
		}
	}

	// Build the week-aligned grid (weeks start on Sunday, GitHub convention).
	startDate := alignToSunday(from)
	weeks := [][]ContribDay{}
	var currentWeek []ContribDay
	var total, activeDays, topStreak int
	streak := 0

	for d := startDate; !d.After(now); d = d.AddDate(0, 0, 1) {
		key := d.Format("2006-01-02")
		count := merged[key]
		currentWeek = append(currentWeek, ContribDay{Date: key, Count: count})
		if len(currentWeek) == 7 {
			weeks = append(weeks, currentWeek)
			currentWeek = nil
		}
		total += count
		if count > 0 {
			activeDays++
			streak++
			if streak > topStreak {
				topStreak = streak
			}
		} else {
			streak = 0
		}
	}
	if len(currentWeek) > 0 {
		// Pad partial trailing week so each row has 7 cells.
		for len(currentWeek) < 7 {
			currentWeek = append(currentWeek, ContribDay{Date: "", Count: 0})
		}
		weeks = append(weeks, currentWeek)
	}

	return &Contributions{
		Total:         total,
		ActiveDays:    activeDays,
		TopStreak:     topStreak,
		CurrentStreak: trailingStreak(merged, now),
		Weeks:         weeks,
		AsOf:          now.Format(time.RFC3339),
		Accounts:      users,
	}, nil
}

func alignToSunday(t time.Time) time.Time {
	for t.Weekday() != time.Sunday {
		t = t.AddDate(0, 0, -1)
	}
	return time.Date(t.Year(), t.Month(), t.Day(), 0, 0, 0, 0, time.UTC)
}

func trailingStreak(byDate map[string]int, end time.Time) int {
	streak := 0
	d := end
	for i := 0; i < 400; i++ {
		key := d.Format("2006-01-02")
		if byDate[key] > 0 {
			streak++
			d = d.AddDate(0, 0, -1)
			continue
		}
		break
	}
	return streak
}

type ghDay struct {
	Date              string `json:"date"`
	ContributionCount int    `json:"contributionCount"`
}
type ghWeek struct {
	ContributionDays []ghDay `json:"contributionDays"`
}
type ghResponse struct {
	Data struct {
		User struct {
			ContributionsCollection struct {
				ContributionCalendar struct {
					Weeks []ghWeek `json:"weeks"`
				} `json:"contributionCalendar"`
			} `json:"contributionsCollection"`
		} `json:"user"`
	} `json:"data"`
	Errors []struct {
		Message string `json:"message"`
	} `json:"errors"`
}

func (g *GitHub) fetchUserDays(user string, from time.Time) (map[string]int, error) {
	query := fmt.Sprintf(`query {
  user(login: "%s") {
    contributionsCollection(from: "%s") {
      contributionCalendar {
        weeks { contributionDays { date contributionCount } }
      }
    }
  }
}`, user, from.Format("2006-01-02T15:04:05Z"))

	body, _ := json.Marshal(map[string]string{"query": query})
	req, err := http.NewRequest(http.MethodPost, "https://api.github.com/graphql", bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+g.token)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("User-Agent", "jainamoswal.xyz-portfolio")

	client := &http.Client{Timeout: 12 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	respBody, _ := io.ReadAll(resp.Body)
	if resp.StatusCode >= 300 {
		return nil, fmt.Errorf("github %d: %s", resp.StatusCode, strings.TrimSpace(string(respBody)))
	}

	var parsed ghResponse
	if err := json.Unmarshal(respBody, &parsed); err != nil {
		return nil, err
	}
	if len(parsed.Errors) > 0 {
		return nil, fmt.Errorf("github: %s", parsed.Errors[0].Message)
	}

	days := make(map[string]int)
	for _, w := range parsed.Data.User.ContributionsCollection.ContributionCalendar.Weeks {
		for _, d := range w.ContributionDays {
			days[d.Date] += d.ContributionCount
		}
	}
	return days, nil
}
