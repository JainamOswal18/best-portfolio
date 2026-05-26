package services

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"gopkg.in/gomail.v2"
)

var ErrMailerNotConfigured = errors.New("contact form is not wired to an email service yet — reach me at jainamoswal1811@gmail.com")

type Mailer struct {
	resendKey  string
	resendFrom string
	smtpHost   string
	smtpPort   int
	smtpUser   string
	smtpPass   string
	from       string
	to         string
}

func NewMailerFromEnv() *Mailer {
	portStr := os.Getenv("SMTP_PORT")
	port, err := strconv.Atoi(portStr)
	if err != nil {
		port = 587
	}
	m := &Mailer{
		resendKey:  strings.TrimSpace(os.Getenv("RESEND_API_KEY")),
		resendFrom: strings.TrimSpace(os.Getenv("RESEND_FROM")),
		smtpHost:   os.Getenv("SMTP_HOST"),
		smtpPort:   port,
		smtpUser:   os.Getenv("SMTP_USER"),
		smtpPass:   os.Getenv("SMTP_PASS"),
		from:       os.Getenv("MAIL_FROM"),
		to:         os.Getenv("MAIL_TO"),
	}
	if m.from == "" {
		m.from = "portfolio@jainamoswal.com"
	}
	if m.to == "" {
		m.to = "jainamoswal1811@gmail.com"
	}
	if m.resendFrom == "" {
		m.resendFrom = "onboarding@resend.dev"
	}
	return m
}

func (m *Mailer) configured() bool {
	return m.resendKey != "" || m.smtpHost != ""
}

func (m *Mailer) SendContact(name, email, message string) error {
	if !m.configured() {
		return ErrMailerNotConfigured
	}
	if m.resendKey != "" {
		return m.sendViaResend(name, email, message)
	}
	return m.sendViaSMTP(name, email, message)
}

func (m *Mailer) SendFeedback(message string) error {
	if !m.configured() {
		return ErrMailerNotConfigured
	}
	if m.resendKey != "" {
		payload := map[string]any{
			"from":    m.resendFrom,
			"to":      []string{m.to},
			"subject": "Portfolio feedback",
			"html":    feedbackHTML(message),
		}
		return postResend(m.resendKey, payload)
	}
	// SMTP fallback
	dialer := gomail.NewDialer(m.smtpHost, m.smtpPort, m.smtpUser, m.smtpPass)
	msg := gomail.NewMessage()
	msg.SetHeader("From", m.from)
	msg.SetHeader("To", m.to)
	msg.SetHeader("Subject", "Portfolio feedback")
	msg.SetBody("text/html", feedbackHTML(message))
	if err := dialer.DialAndSend(msg); err != nil {
		return fmt.Errorf("send feedback: %w", err)
	}
	return nil
}

func feedbackHTML(message string) string {
	return fmt.Sprintf(`<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px">
  <h2 style="margin:0 0 16px">New feedback from your portfolio</h2>
  <pre style="white-space:pre-wrap;background:#f6f8fa;padding:12px;border-radius:6px;font-family:JetBrains Mono,ui-monospace,monospace">%s</pre>
  <p style="color:#666;font-size:12px;margin-top:16px">Sent at %s</p>
</div>`, message, time.Now().UTC().Format(time.RFC3339))
}

func (m *Mailer) sendViaResend(name, email, message string) error {
	notify := map[string]any{
		"from":     m.resendFrom,
		"to":       []string{m.to},
		"reply_to": email,
		"subject":  fmt.Sprintf("New portfolio contact from %s", name),
		"html":     contactHTML(name, email, message),
	}
	if err := postResend(m.resendKey, notify); err != nil {
		return fmt.Errorf("send notification: %w", err)
	}

	// Auto-reply only attempted if RESEND_FROM is a custom verified domain.
	// With the default onboarding@resend.dev, Resend refuses to send to arbitrary recipients.
	if m.resendFrom != "onboarding@resend.dev" {
		reply := map[string]any{
			"from":    m.resendFrom,
			"to":      []string{email},
			"subject": "Thanks for reaching out — Jainam",
			"html":    autoReplyHTML(name),
		}
		_ = postResend(m.resendKey, reply) // best-effort
	}
	return nil
}

func postResend(apiKey string, payload map[string]any) error {
	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	req, err := http.NewRequest(http.MethodPost, "https://api.resend.com/emails", bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bearer "+apiKey)
	req.Header.Set("Content-Type", "application/json")
	client := &http.Client{Timeout: 12 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 200 && resp.StatusCode < 300 {
		return nil
	}
	respBody, _ := io.ReadAll(resp.Body)
	return fmt.Errorf("resend %d: %s", resp.StatusCode, strings.TrimSpace(string(respBody)))
}

func (m *Mailer) sendViaSMTP(name, email, message string) error {
	dialer := gomail.NewDialer(m.smtpHost, m.smtpPort, m.smtpUser, m.smtpPass)

	notify := gomail.NewMessage()
	notify.SetHeader("From", m.from)
	notify.SetHeader("To", m.to)
	notify.SetHeader("Reply-To", email)
	notify.SetHeader("Subject", fmt.Sprintf("New Portfolio Contact from %s", name))
	notify.SetBody("text/html", contactHTML(name, email, message))

	if err := dialer.DialAndSend(notify); err != nil {
		return fmt.Errorf("send notification: %w", err)
	}

	reply := gomail.NewMessage()
	reply.SetHeader("From", m.from)
	reply.SetHeader("To", email)
	reply.SetHeader("Subject", "Thanks for reaching out — Jainam")
	reply.SetBody("text/html", autoReplyHTML(name))

	if err := dialer.DialAndSend(reply); err != nil {
		return fmt.Errorf("send auto-reply: %w", err)
	}
	return nil
}

func contactHTML(name, email, message string) string {
	return fmt.Sprintf(`<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px">
  <h2 style="margin:0 0 16px">New portfolio contact</h2>
  <table style="border-collapse:collapse;width:100%%">
    <tr><td style="padding:6px 0;color:#666">Name</td><td style="padding:6px 0"><strong>%s</strong></td></tr>
    <tr><td style="padding:6px 0;color:#666">Email</td><td style="padding:6px 0"><a href="mailto:%s">%s</a></td></tr>
    <tr><td style="padding:6px 0;color:#666">Sent at</td><td style="padding:6px 0">%s</td></tr>
  </table>
  <h3 style="margin:20px 0 8px">Message</h3>
  <pre style="white-space:pre-wrap;background:#f6f8fa;padding:12px;border-radius:6px">%s</pre>
</div>`, name, email, email, time.Now().UTC().Format(time.RFC3339), message)
}

func autoReplyHTML(name string) string {
	return fmt.Sprintf(`<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px">
  <p>Hey %s,</p>
  <p>Thanks for reaching out through my terminal portfolio. I've got your message and will get back to you shortly.</p>
  <p>In the meantime, you can also find me on <a href="https://github.com/JainamOswal18">GitHub</a> and <a href="https://linkedin.com/in/jainam-oswal">LinkedIn</a>.</p>
  <p>— Jainam Oswal</p>
</div>`, name)
}
