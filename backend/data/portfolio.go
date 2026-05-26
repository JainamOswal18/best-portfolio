package data

import (
	_ "embed"
	"encoding/json"
	"fmt"
	"strings"
)

//go:embed banner.txt
var bannerText string

//go:embed resume.pdf
var resumePDF []byte

//go:embed jainam.jpg
var photoBytes []byte

type Whoami struct {
	Name              string   `json:"name"`
	Title             string   `json:"title"`
	CurrentRole       string   `json:"current_role"`
	CurrentOrg        string   `json:"current_org"`
	YearsOfExperience string   `json:"years_of_experience"`
	Focus             []string `json:"focus"`
	PreferredRoles    []string `json:"preferred_roles"`
	OpenTo            string   `json:"open_to"`
	University        string   `json:"university"`
	CGPA              string   `json:"cgpa"`
	PhotoURL          string   `json:"photo_url"`
	Location          string   `json:"location"`
}

type Education struct {
	Degree      string `json:"degree"`
	Institution string `json:"institution"`
	Years       string `json:"years"`
	CGPA        string `json:"cgpa"`
}

type About struct {
	Summary   string    `json:"summary"`
	Bio       string    `json:"bio"`
	Education Education `json:"education"`
	Interests []string  `json:"interests"`
}

type ProjectSummary struct {
	Slug    string `json:"slug"`
	Name    string `json:"name"`
	Tagline string `json:"tagline"`
}

type Project struct {
	Slug        string   `json:"slug"`
	Name        string   `json:"name"`
	Tagline     string   `json:"tagline"`
	Description string   `json:"description"`
	Stack       []string `json:"stack"`
	Highlights  []string `json:"highlights"`
	GitHub      string   `json:"github"`
	Live        string   `json:"live"`
}

type Experience struct {
	Slug       string   `json:"slug"`
	Company    string   `json:"company"`
	Title      string   `json:"title"`
	Duration   string   `json:"duration"`
	Current    bool     `json:"current"`
	Summary    string   `json:"summary"`
	Highlights []string `json:"highlights"`
}

type CommunityRole struct {
	Title  string `json:"title"`
	Detail string `json:"detail"`
}

type Hackathon struct {
	Name   string `json:"name"`
	Result string `json:"result"`
}

type Community struct {
	Roles      []CommunityRole `json:"roles"`
	Impact     string          `json:"impact"`
	Hackathons []Hackathon     `json:"hackathons"`
}

type Social struct {
	Name    string `json:"name"`
	URL     string `json:"url"`
	Display string `json:"display,omitempty"`
}

type Command struct {
	Name     string `json:"name"`
	Category string `json:"category"`
	Summary  string `json:"summary"`
}

type Skills struct {
	Languages    []string `json:"languages"`
	Frontend     []string `json:"frontend"`
	Backend      []string `json:"backend"`
	Databases    []string `json:"databases"`
	DevOps       []string `json:"devops"`
	SystemDesign []string `json:"system-design"`
}

func Banner() string { return bannerText }

func ResumePDF() []byte { return resumePDF }

func Photo() []byte { return photoBytes }

func GetWhoami() Whoami {
	return Whoami{
		Name:              "Jainam Oswal",
		Title:             "Full Stack AI Engineer",
		CurrentRole:       "Full Stack Developer Intern",
		CurrentOrg:        "CurlScape Solutions",
		YearsOfExperience: "1+ years · 5 roles across Full Stack, AI, Backend, and Data Engineering",
		Focus:             []string{"Full Stack Engineering", "AI / GenAI integrations", "Microservices on GCP", "Backend systems"},
		PreferredRoles:    []string{"Full Stack Engineer", "AI Engineer", "Backend Engineer", "GenAI Engineer"},
		OpenTo:            "Internships · Freelance projects · Full-time (Aug 2027 onwards)",
		University:        "Bharati Vidyapeeth College of Engineering, Pune",
		CGPA:              "9.6",
		PhotoURL:          "/api/photo",
		Location:          "Pune, India",
	}
}

func GetAbout() About {
	return About{
		Summary: "Full Stack Engineer building AI-native products and distributed microservices across Go, TypeScript, and GCP — currently shipping a GDPR-compliant AI recruiter platform at CurlScape Solutions.",
		Bio: "I'm Jainam Oswal, a Full Stack Engineer pursuing B.Tech IT at Bharati Vidyapeeth College of Engineering, Pune with a 9.6 CGPA. I'm currently a Full Stack Developer Intern at CurlScape Solutions in Pune, working in an AI-native codebase with Claude Code and 200+ custom skills, shipping features across a Go + TypeScript microservices monorepo (20+ services) on GCP Cloud Run for a Europe-based recruiter management platform. Before that I built NestJS + gRPC pipelines and LLM-driven WhatsApp campaigns at LocalStreet RetailTech, led resume-scoring (27x speedup), Vapi.ai Voice AI, and a video assessment platform for Masters Union as a Founding Full Stack Engineer at Elite HQ, and architected ForesightFlow's 5-microservice GCP retail-analytics platform with a 97-KPI engine and Gemini insights — production-ready in a month. I'm a GDG on Campus Organizer and MetaMask Ambassador at Bharati Vidyapeeth, impacting 500+ students through AI/Cloud/Full-Stack sessions, and I've placed at JPMC Code for Good, 100x Engineers, Innerve 9, and Imagine Hackathon 2025. Outside the terminal you'll find me trekking the Sahyadris, exploring forts, or shipping weekend hackathon builds.",
		Education: Education{
			Degree:      "B.Tech Information Technology",
			Institution: "Bharati Vidyapeeth College of Engineering, Pune",
			Years:       "July 2023 – July 2027",
			CGPA:        "9.6",
		},
		Interests: []string{"Mountain trekking", "Forts & hill stations", "Open source", "Hackathons"},
	}
}

func GetSkills() Skills {
	return Skills{
		Languages:    []string{"Java", "C", "Python", "JavaScript", "SQL", "Bash"},
		Frontend:     []string{"HTML5", "CSS3", "React", "Bootstrap", "EJS", "Axios"},
		Backend:      []string{"Node.js", "Express.js", "Supabase", "JWT", "OAuth2", "Nest.js", "gRPC"},
		Databases:    []string{"MySQL", "PostgreSQL", "MongoDB", "SQLite"},
		DevOps:       []string{"AWS (EC2, S3, Lambda, Glue)", "Docker", "Git", "GitHub", "Postman", "GCP (Cloud Run, Storage, SQL)"},
		SystemDesign: []string{"Microservices", "Load Balancing", "Caching", "Sharding", "CAP Theorem"},
	}
}

func GetSkillCategory(cat string) ([]string, bool) {
	s := GetSkills()
	switch strings.ToLower(cat) {
	case "languages":
		return s.Languages, true
	case "frontend":
		return s.Frontend, true
	case "backend":
		return s.Backend, true
	case "databases":
		return s.Databases, true
	case "devops":
		return s.DevOps, true
	case "system-design":
		return s.SystemDesign, true
	}
	return nil, false
}

func GetProjects() []Project {
	return []Project{
		{
			Slug:        "foresightflow",
			Name:        "ForesightFlow Platform",
			Tagline:     "AI-powered retail analytics — 5 microservices on GCP, shipped in 1 month",
			Description: "Production-ready AI-powered retail analytics platform delivered in a month with five microservices (ETL, Analysis, Chatbot, Market Analysis, Strategy) on GCP Cloud Run, a 97-KPI engine, Gemini-driven insights, and natural-language SQL translation.",
			Stack:       []string{"Next.js", "GCP Cloud Run", "WebSocket", "Google Gemini", "PostgreSQL"},
			Highlights: []string{
				"5 microservices: ETL, Analysis, Chatbot, Market Analysis, Strategy",
				"97-KPI engine with WebSocket real-time sync",
				"Processes 20,000+ row datasets in under 2 minutes with 100% referential integrity",
				"Gemini-powered conversational analytics + 90/365-day strategic planning",
			},
			GitHub: "",
			Live:   "",
		},
		{
			Slug:        "resume-scoring",
			Name:        "Resume Scoring System",
			Tagline:     "Parallel resume parsing — 27x speedup (45 min → 100 s)",
			Description: "Redesigned the resume parsing and ranking engine at Elite HQ to process 1,000+ resumes in parallel, reducing end-to-end ranking time from 45 minutes to 100 seconds (27x) while maintaining 90%+ accuracy.",
			Stack:       []string{"Node.js", "Parallel processing", "Scoring pipeline"},
			Highlights: []string{
				"1,000+ resumes processed in parallel",
				"45 min → 100 s ranking time (27x improvement)",
				"90%+ scoring accuracy",
			},
			GitHub: "",
			Live:   "",
		},
		{
			Slug:        "voice-ai-outreach",
			Name:        "Vapi.ai Voice AI Outreach",
			Tagline:     "Automated context-aware candidate calls with sentiment analysis",
			Description: "Vapi.ai integration at Elite HQ for automated, context-aware candidate outreach — capturing call recordings, full transcripts, and AI-driven sentiment analysis to surface intelligent hiring feedback.",
			Stack:       []string{"Vapi.ai", "Node.js", "TypeScript", "LLM sentiment analysis"},
			Highlights: []string{
				"Context-aware automated candidate calls",
				"Call recordings + transcript capture",
				"AI sentiment analysis for hiring feedback",
			},
			GitHub: "",
			Live:   "",
		},
		{
			Slug:        "video-elitehq",
			Name:        "video.elitehq — Video Assessment Platform",
			Tagline:     "MBA admissions video assessment for Masters Union, with Gemini 3.0 Pro evaluation",
			Description: "Architected video.elitehq for Masters Union's MBA admissions, enabling browser-to-GCP direct uploads for videos up to 500MB and multimodal evaluation with Google Gemini 3.0 Pro across six dimensions.",
			Stack:       []string{"React", "GCP Storage", "Google Gemini 3.0 Pro", "Direct browser upload"},
			Highlights: []string{
				"Browser-to-GCP direct upload (up to 500 MB videos)",
				"Multimodal evaluation with Gemini 3.0 Pro",
				"Scored across 6 dimensions",
				"Shipped for Masters Union MBA admissions",
			},
			GitHub: "",
			Live:   "https://video.elitehq.in",
		},
		{
			Slug:        "campaign-analytics",
			Name:        "AI Campaign Analytics Platform",
			Tagline:     "NestJS + gRPC pipeline for offline-retail campaign targeting",
			Description: "NestJS + gRPC microservice pipeline at LocalStreet RetailTech that ingests offline order datasets (CSV/XLSX via AWS S3), performs AI-powered column mapping, and generates targeted customer pools using frequency and lifetime-value analytics.",
			Stack:       []string{"NestJS", "gRPC", "AWS S3", "AI column mapping", "SonarQube"},
			Highlights: []string{
				"CSV/XLSX ingestion via AWS S3",
				"AI-powered column mapping",
				"Frequency + lifetime-value customer targeting",
				"SonarQube-driven code quality + PR review workflow",
			},
			GitHub: "",
			Live:   "",
		},
		{
			Slug:        "whatsapp-rag",
			Name:        "WhatsApp Conversational Ordering",
			Tagline:     "RAG-based preference retrieval over RediSearch",
			Description: "Backend for a WhatsApp-based ordering platform at LocalStreet, with LLM-generated promotions and a RAG layer on RediSearch that persists and retrieves contextual user data (saved addresses, ordering preferences) to power conversational order flows.",
			Stack:       []string{"NestJS", "RediSearch", "LLM", "WhatsApp Cloud API"},
			Highlights: []string{
				"LLM-generated WhatsApp promotions + discount recommendations",
				"RAG-based preference retrieval via RediSearch",
				"Campaign pipeline targeting thousands of customers per send",
			},
			GitHub: "",
			Live:   "",
		},
		{
			Slug:        "recruiter-platform",
			Name:        "AI Recruiter Management Platform",
			Tagline:     "GDPR-compliant AI recruiter for a Europe-based client (CurlScape)",
			Description: "Full Stack engineering on a GDPR-compliant AI recruiter platform built for a Europe-based client at CurlScape Solutions — covering candidate sourcing, AI-driven interviewing, and end-to-end deployment across a Go + TypeScript microservices monorepo on GCP Cloud Run.",
			Stack:       []string{"Go", "TypeScript", "GCP Cloud Run", "GCP Secret Manager", "Claude Code"},
			Highlights: []string{
				"20+ service Go + TypeScript monorepo",
				"AI-driven candidate interviewing",
				"GDPR-compliant data handling",
				"Claude Code + 200+ custom skills in the dev workflow",
			},
			GitHub: "",
			Live:   "",
		},
		{
			Slug:        "arealis-etl",
			Name:        "Event-Driven ETL System",
			Tagline:     "AWS Lambda + Glue ETL — 80% manual-effort reduction",
			Description: "Event-driven ETL system at Arealis Networks built on AWS Lambda and Glue for automated ETL workflows and real-time KPI calculations, cutting manual effort by 80%.",
			Stack:       []string{"AWS Lambda", "AWS Glue", "Event-driven architecture", "Real-time KPIs"},
			Highlights: []string{
				"Scalable event-driven architecture",
				"Automated ETL with real-time KPIs",
				"80% reduction in manual effort",
				"Demoed at E-Summit 2025 (IIT Bombay)",
			},
			GitHub: "",
			Live:   "",
		},
	}
}

func GetProjectSummaries() []ProjectSummary {
	projects := GetProjects()
	out := make([]ProjectSummary, len(projects))
	for i, p := range projects {
		out[i] = ProjectSummary{Slug: p.Slug, Name: p.Name, Tagline: p.Tagline}
	}
	return out
}

func GetProjectBySlug(slug string) (Project, bool) {
	for _, p := range GetProjects() {
		if p.Slug == slug {
			return p, true
		}
	}
	return Project{}, false
}

func GetExperience() []Experience {
	return []Experience{
		{
			Slug:     "curlscape",
			Company:  "CurlScape Solutions Pvt Ltd",
			Title:    "Full Stack Developer Intern",
			Duration: "April 2026 – Present",
			Current:  true,
			Summary:  "Pune, India · AI-native development on a Go + TypeScript microservices monorepo for a Europe-based AI recruiter platform on GCP Cloud Run.",
			Highlights: []string{
				"AI-Assisted Development Workflow: AI-native codebase with Claude Code as engineering assistant, 200+ custom skills and workspace automations, averaging 9+ active hours/day shipping features end-to-end",
				"Production Engineering & DevOps: Full deployment lifecycle across a 20+ service Go + TypeScript monorepo — GitHub PRs, CI/CD failure resolution, DB migrations from staging to production on GCP Cloud Run, secrets via GCP Secret Manager, work tracked in Jira and coordinated on Slack",
				"Product & Client Interaction: Contributed to an AI-powered recruiter management platform for a Europe-based client — candidate sourcing, AI-driven interviewing, GDPR-compliant data handling. Led direct client-facing communication on feature requirements and incident resolution",
			},
		},
		{
			Slug:     "localstreet",
			Company:  "LocalStreet RetailTech Pvt Ltd",
			Title:    "Backend Developer",
			Duration: "February 2026 – April 2026",
			Current:  false,
			Summary:  "Remote, India · NestJS + gRPC microservice pipelines, LLM-driven WhatsApp campaigns, and a RAG layer on RediSearch.",
			Highlights: []string{
				"AI-Driven Campaign Analytics Platform: NestJS + gRPC microservice pipeline ingesting offline order datasets (CSV/XLSX via AWS S3), AI-powered column mapping, frequency + lifetime-value customer targeting, under a SonarQube-driven code-quality and PR-review workflow",
				"Intelligent Marketing Campaign Engine: End-to-end backend for campaigns with LLM-generated WhatsApp promotions and discount recommendations, targeting thousands of customers per campaign",
				"WhatsApp Conversational Ordering System: Contributed to a WhatsApp-based ordering platform — implemented RAG-based preference retrieval using RediSearch to persist and fetch contextual user data (saved addresses, ordering preferences)",
			},
		},
		{
			Slug:     "elite-hq",
			Company:  "Elite HQ",
			Title:    "Founding Full Stack Engineer",
			Duration: "October 2025 – February 2026",
			Current:  false,
			Summary:  "Remote, India · Resume scoring with 27x speedup, Vapi.ai voice outreach, Apollo/Clado/Razorpay integrations, and video.elitehq for Masters Union MBA admissions.",
			Highlights: []string{
				"Resume Scoring System: Redesigned the parsing engine to process 1,000+ resumes in parallel — reduced ranking time from 45 minutes to 100 seconds (27x improvement) with 90%+ accuracy",
				"Voice AI Outreach: Vapi.ai integration for automated context-aware candidate calls with call recordings, transcripts, and AI sentiment analysis for hiring feedback",
				"Monetization & Integrations: Integrated Apollo.io, Clado APIs (800M+ profiles), and Razorpay with subscription management and credit-deduction system",
				"Video Assessment Platform: Architected video.elitehq for Masters Union MBA admissions — browser-to-GCP direct uploads up to 500 MB, multimodal evaluation with Google Gemini 3.0 Pro across 6 dimensions",
			},
		},
		{
			Slug:     "foresightflow-co",
			Company:  "ForesightFlow Platform",
			Title:    "Full Stack Engineer",
			Duration: "November 2025 – March 2026",
			Current:  false,
			Summary:  "Freelance, Remote · Architected an AI-powered retail-analytics platform with 5 microservices on GCP, a 97-KPI engine, and Gemini-driven analytics — production-ready in 1 month.",
			Highlights: []string{
				"Microservices Architecture & Rapid Delivery: Production-ready AI-powered retail analytics platform delivered in 1 month — 5 microservices (ETL, Analysis, Chatbot, Market Analysis, Strategy) on GCP Cloud Run",
				"Real-Time Analytics & KPI Engine: 97-KPI calculation engine with Next.js dashboards and WebSocket real-time sync — processes 20,000+ row datasets in under 2 minutes with 100% referential integrity across Sales, Inventory, Product, and Financial modules",
				"AI-Powered Intelligence Layer: Integrated Google Gemini API for conversational analytics, automated insights generation, market benchmarking, and 90/365-day strategic planning with natural-language query support and SQL translation",
			},
		},
		{
			Slug:     "arealis",
			Company:  "Arealis Networks Pvt Ltd",
			Title:    "Full Stack Data Engineering Intern",
			Duration: "June 2025 – November 2025",
			Current:  false,
			Summary:  "Pune, Maharashtra · Event-driven ETL on AWS Lambda + Glue, client-facing sprint leadership, and product demos at E-Summit 2025 (IIT Bombay).",
			Highlights: []string{
				"Event-Driven Architecture Design: Scalable event-driven system using AWS Lambda and Glue for automated ETL workflows with real-time KPI calculations — reduced manual effort by 80%",
				"Client Leadership & Product Strategy: Led sprint reviews and client interactions, presented technical architecture and progress, gathered stakeholder feedback, aligned roadmap with business requirements",
				"Product Representation & Business Development: Represented Arealis at E-Summit 2025 (IIT Bombay Startup Expo) — demonstrated the AI-powered analytics platform to 50+ industry attendees and generated qualified leads",
			},
		},
	}
}

func GetExperienceBySlug(slug string) (Experience, bool) {
	for _, e := range GetExperience() {
		if e.Slug == slug {
			return e, true
		}
	}
	return Experience{}, false
}

func GetCommunity() Community {
	return Community{
		Roles: []CommunityRole{
			{Title: "GDG on Campus — Organizer", Detail: "Bharati Vidyapeeth College of Engineering, Pune · Aug 2025 – Present · Technical training & community building. Conducted sessions on AI, Cloud, and Full-Stack development impacting 500+ students."},
			{Title: "Campus Hackathon Organizer", Detail: "Organized a campus hackathon with 150+ participants under the GDG umbrella."},
			{Title: "MetaMask Ambassador", Detail: "Organized 3 MetaMask meetups on campus for 200+ developers."},
		},
		Impact: "500+ students impacted via sessions · 150+ participants at the campus hackathon · 200+ developers across 3 MetaMask meetups · 7+ national hackathons · 50+ tech meetups attended (GenAI, Cloud, Blockchain, Full-Stack)",
		Hackathons: []Hackathon{
			{Name: "JPMC Code for Good", Result: "Finalist · Top 1,500 / 50,000+"},
			{Name: "100x Engineers", Result: "Top 100 / 3,500+"},
			{Name: "Innerve 9", Result: "Top 31 / 2,500+"},
			{Name: "Imagine Hackathon 2025", Result: "Top 75 / 3,000+"},
		},
	}
}

func GetSocials() []Social {
	return []Social{
		{Name: "github", URL: "https://github.com/JainamOswal18"},
		{Name: "linkedin", URL: "https://linkedin.com/in/jainam-oswal"},
		{Name: "email", URL: "mailto:jainamoswal1811@gmail.com", Display: "jainamoswal1811@gmail.com"},
	}
}

func GetCommands() []Command {
	return []Command{
		{Name: "help", Category: "system", Summary: "Show available commands"},
		{Name: "clear", Category: "system", Summary: "Clear the terminal screen"},
		{Name: "banner", Category: "system", Summary: "Reprint the boot banner"},
		{Name: "history", Category: "system", Summary: "Show command history"},
		{Name: "echo", Category: "system", Summary: "Echo arguments back to the terminal"},
		{Name: "whoami", Category: "identity", Summary: "Who is Jainam?"},
		{Name: "about", Category: "identity", Summary: "Bio, education, interests"},
		{Name: "skills", Category: "skills", Summary: "List all skill categories"},
		{Name: "skills <category>", Category: "skills", Summary: "Drill into one skill category"},
		{Name: "experience", Category: "experience", Summary: "List work experience"},
		{Name: "experience <slug>", Category: "experience", Summary: "Show details for one role"},
		{Name: "community", Category: "community", Summary: "Community roles + hackathons"},
		{Name: "resume", Category: "resume", Summary: "Open the resume PDF"},
		{Name: "resume preview", Category: "resume", Summary: "Plain-text resume in the terminal"},
		{Name: "socials", Category: "socials", Summary: "GitHub, LinkedIn, email"},
		{Name: "contact", Category: "socials", Summary: "Send a message to Jainam"},
		{Name: "ask <question>", Category: "ai", Summary: "Ask the AI assistant about Jainam"},
		{Name: "roast", Category: "ai", Summary: "Get a witty AI roast"},
		{Name: "summarize", Category: "ai", Summary: "AI-generated one-paragraph bio"},
		{Name: "sudo", Category: "easter-eggs", Summary: "Try it and see"},
		{Name: "matrix", Category: "easter-eggs", Summary: "Enter the matrix"},
		{Name: "coffee", Category: "easter-eggs", Summary: "Brew a virtual cup"},
	}
}

func PortfolioJSON() string {
	payload := map[string]any{
		"whoami":     GetWhoami(),
		"about":      GetAbout(),
		"skills":     GetSkills(),
		"projects":   GetProjects(),
		"experience": GetExperience(),
		"community":  GetCommunity(),
		"socials":    GetSocials(),
	}
	b, err := json.Marshal(payload)
	if err != nil {
		return "{}"
	}
	return string(b)
}

func ResumePreview() string {
	w := GetWhoami()
	a := GetAbout()
	var b strings.Builder

	line := strings.Repeat("=", 60)
	fmt.Fprintln(&b, line)
	fmt.Fprintf(&b, "%s — %s\n", w.Name, w.Title)
	fmt.Fprintf(&b, "%s · %s\n", w.Location, w.University)
	for _, s := range GetSocials() {
		if s.Display != "" {
			fmt.Fprintf(&b, "%s: %s\n", s.Name, s.Display)
		} else {
			fmt.Fprintf(&b, "%s: %s\n", s.Name, s.URL)
		}
	}
	fmt.Fprintln(&b, line)

	fmt.Fprintln(&b, "\nEDUCATION")
	fmt.Fprintln(&b, strings.Repeat("-", 60))
	fmt.Fprintf(&b, "%s, %s (%s) — CGPA %s\n", a.Education.Degree, a.Education.Institution, a.Education.Years, a.Education.CGPA)

	fmt.Fprintln(&b, "\nEXPERIENCE")
	fmt.Fprintln(&b, strings.Repeat("-", 60))
	for _, e := range GetExperience() {
		fmt.Fprintf(&b, "%s — %s\n  %s\n", e.Title, e.Company, e.Duration)
		fmt.Fprintf(&b, "  %s\n", e.Summary)
		for _, h := range e.Highlights {
			fmt.Fprintf(&b, "    - %s\n", h)
		}
		fmt.Fprintln(&b)
	}

	fmt.Fprintln(&b, "PROJECTS")
	fmt.Fprintln(&b, strings.Repeat("-", 60))
	for _, p := range GetProjects() {
		fmt.Fprintf(&b, "%s — %s\n", p.Name, p.Tagline)
		fmt.Fprintf(&b, "  Stack: %s\n", strings.Join(p.Stack, ", "))
		for _, h := range p.Highlights {
			fmt.Fprintf(&b, "    - %s\n", h)
		}
		fmt.Fprintln(&b)
	}

	fmt.Fprintln(&b, "SKILLS")
	fmt.Fprintln(&b, strings.Repeat("-", 60))
	s := GetSkills()
	fmt.Fprintf(&b, "Languages:     %s\n", strings.Join(s.Languages, ", "))
	fmt.Fprintf(&b, "Frontend:      %s\n", strings.Join(s.Frontend, ", "))
	fmt.Fprintf(&b, "Backend:       %s\n", strings.Join(s.Backend, ", "))
	fmt.Fprintf(&b, "Databases:     %s\n", strings.Join(s.Databases, ", "))
	fmt.Fprintf(&b, "DevOps:        %s\n", strings.Join(s.DevOps, ", "))
	fmt.Fprintf(&b, "System Design: %s\n", strings.Join(s.SystemDesign, ", "))

	c := GetCommunity()
	fmt.Fprintln(&b, "\nCOMMUNITY")
	fmt.Fprintln(&b, strings.Repeat("-", 60))
	for _, r := range c.Roles {
		fmt.Fprintf(&b, "  - %s (%s)\n", r.Title, r.Detail)
	}
	fmt.Fprintf(&b, "Impact: %s\n", c.Impact)
	fmt.Fprintln(&b, "Hackathons:")
	for _, h := range c.Hackathons {
		fmt.Fprintf(&b, "  - %s — %s\n", h.Name, h.Result)
	}

	fmt.Fprintln(&b, "\nCONTACT")
	fmt.Fprintln(&b, strings.Repeat("-", 60))
	for _, sc := range GetSocials() {
		if sc.Display != "" {
			fmt.Fprintf(&b, "%s: %s\n", sc.Name, sc.Display)
		} else {
			fmt.Fprintf(&b, "%s: %s\n", sc.Name, sc.URL)
		}
	}

	return b.String()
}
