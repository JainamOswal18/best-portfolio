package services

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"
)

// ErrKVNotConfigured is returned when no Upstash / Vercel KV env vars are set.
var ErrKVNotConfigured = errors.New("KV store is not wired yet")

// KV is a thin wrapper over Upstash Redis REST API. Vercel's KV (Upstash on the
// marketplace) auto-injects KV_REST_API_URL and KV_REST_API_TOKEN. Falls back
// to UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN if those aren't set.
type KV struct {
	base  string
	token string
}

func NewKVFromEnv() *KV {
	base := firstNonEmpty(os.Getenv("KV_REST_API_URL"), os.Getenv("UPSTASH_REDIS_REST_URL"))
	tok := firstNonEmpty(os.Getenv("KV_REST_API_TOKEN"), os.Getenv("UPSTASH_REDIS_REST_TOKEN"))
	return &KV{base: strings.TrimRight(base, "/"), token: tok}
}

func (k *KV) Enabled() bool { return k.base != "" && k.token != "" }

func firstNonEmpty(values ...string) string {
	for _, v := range values {
		if v != "" {
			return v
		}
	}
	return ""
}

func (k *KV) call(method string, parts ...string) ([]byte, error) {
	if !k.Enabled() {
		return nil, ErrKVNotConfigured
	}
	encoded := make([]string, len(parts))
	for i, p := range parts {
		encoded[i] = url.PathEscape(p)
	}
	endpoint := k.base + "/" + strings.Join(encoded, "/")
	req, err := http.NewRequest(method, endpoint, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+k.token)
	client := &http.Client{Timeout: 8 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode >= 200 && resp.StatusCode < 300 {
		return body, nil
	}
	return nil, fmt.Errorf("kv %d: %s", resp.StatusCode, strings.TrimSpace(string(body)))
}

func (k *KV) postJSON(payload any, parts ...string) ([]byte, error) {
	if !k.Enabled() {
		return nil, ErrKVNotConfigured
	}
	encoded := make([]string, len(parts))
	for i, p := range parts {
		encoded[i] = url.PathEscape(p)
	}
	endpoint := k.base + "/" + strings.Join(encoded, "/")
	body, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}
	req, err := http.NewRequest(http.MethodPost, endpoint, bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+k.token)
	req.Header.Set("Content-Type", "application/json")
	client := &http.Client{Timeout: 8 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	respBody, _ := io.ReadAll(resp.Body)
	if resp.StatusCode >= 200 && resp.StatusCode < 300 {
		return respBody, nil
	}
	return nil, fmt.Errorf("kv %d: %s", resp.StatusCode, strings.TrimSpace(string(respBody)))
}

type kvResult struct {
	Result any `json:"result"`
}

// Incr atomically increments a numeric counter and returns the new value.
func (k *KV) Incr(key string) (int64, error) {
	body, err := k.call(http.MethodPost, "incr", key)
	if err != nil {
		return 0, err
	}
	var out kvResult
	if err := json.Unmarshal(body, &out); err != nil {
		return 0, err
	}
	switch v := out.Result.(type) {
	case float64:
		return int64(v), nil
	case string:
		var n int64
		fmt.Sscanf(v, "%d", &n)
		return n, nil
	}
	return 0, fmt.Errorf("kv incr: unexpected result %v", out.Result)
}

// Get returns the string value at key (or "" if missing).
func (k *KV) Get(key string) (string, error) {
	body, err := k.call(http.MethodGet, "get", key)
	if err != nil {
		return "", err
	}
	var out kvResult
	if err := json.Unmarshal(body, &out); err != nil {
		return "", err
	}
	if s, ok := out.Result.(string); ok {
		return s, nil
	}
	return "", nil
}

// LPush prepends one entry to a list and trims to maxLen.
func (k *KV) LPushTrim(key, value string, maxLen int) error {
	if _, err := k.postJSON([]string{value}, "lpush", key); err != nil {
		return err
	}
	if maxLen > 0 {
		if _, err := k.call(http.MethodPost, "ltrim", key, "0", fmt.Sprintf("%d", maxLen-1)); err != nil {
			return err
		}
	}
	return nil
}

// LRange returns up to count most-recent entries (since we LPush, index 0 is newest).
func (k *KV) LRange(key string, count int) ([]string, error) {
	if count <= 0 {
		count = 50
	}
	body, err := k.call(http.MethodGet, "lrange", key, "0", fmt.Sprintf("%d", count-1))
	if err != nil {
		return nil, err
	}
	var out struct {
		Result []string `json:"result"`
	}
	if err := json.Unmarshal(body, &out); err != nil {
		return nil, err
	}
	return out.Result, nil
}
