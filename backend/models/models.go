package models

import "time"

type KPIResponse struct {
	Projects     int     `json:"projects"`
	WorkPackages int     `json:"work_packages"`
	Users        int     `json:"users"`
	Closed       int     `json:"closed"`
	Overdue      int     `json:"overdue"`
	InProgress   int     `json:"in_progress"`
	OnHold       int     `json:"on_hold"`
	Rejected     int     `json:"rejected"`
	CloseRate    float64 `json:"close_rate"`
}

type FilterOption struct {
	ID       int    `json:"id"`
	Name     string `json:"name"`
	IsClosed *bool  `json:"is_closed,omitempty"`
}

type ProjectOption struct {
	ID         int    `json:"id"`
	Name       string `json:"name"`
	Identifier string `json:"identifier"`
}

type FilterMetaResponse struct {
	Statuses   []FilterOption  `json:"statuses"`
	Types      []FilterOption  `json:"types"`
	Priorities []FilterOption  `json:"priorities"`
	Projects   []ProjectOption `json:"projects"`
}

type StatusDistributionItem struct {
	Status   string `json:"status"`
	Count    int    `json:"count"`
	IsClosed bool   `json:"is_closed"`
}

type TypeDistributionItem struct {
	Type  string `json:"type"`
	Count int    `json:"count"`
}

type PriorityDistributionItem struct {
	Priority string `json:"priority"`
	Count    int    `json:"count"`
}

type MonthlyVolumeItem struct {
	Month    string `json:"month"`
	Created  int    `json:"created"`
	Resolved int    `json:"resolved"`
	Count    int    `json:"count"`
}

type ProjectItem struct {
	ID               int        `json:"id"`
	Name             string     `json:"name"`
	Identifier       string     `json:"identifier"`
	Active           bool       `json:"active"`
	CreatedAt        *time.Time `json:"created_at"`
	WpCount          int        `json:"wp_count"`
	ClosedCount      int        `json:"closed_count"`
	OverdueCount     int        `json:"overdue_count"`
	HighPriorityOpen int        `json:"high_priority_open"`
	AvgDone          float64    `json:"avg_done"`
	EstimatedHours   float64    `json:"estimated_hours"`
	SpentHours       float64    `json:"spent_hours"`
	CloseRate        float64    `json:"close_rate"`
	Health           string     `json:"health"`
	HealthLabel      string     `json:"health_label"`
}

type WorkPackageItem struct {
	ID                int        `json:"id"`
	Subject           string     `json:"subject"`
	Status            string     `json:"status"`
	IsClosed          bool       `json:"is_closed"`
	Type              string     `json:"type"`
	Priority          string     `json:"priority"`
	ProjectID         int        `json:"project_id"`
	Project           string     `json:"project"`
	ProjectIdentifier string     `json:"project_identifier"`
	DueDate           *string    `json:"due_date"`
	StartDate         *string    `json:"start_date"`
	DoneRatio         *int       `json:"done_ratio"`
	EstimatedHours    *float64   `json:"estimated_hours"`
	CreatedAt         *time.Time `json:"created_at"`
	UpdatedAt         *time.Time `json:"updated_at"`
	DaysOverdue       int        `json:"days_overdue"`
	Assignee          *string    `json:"assignee"`
}

type WorkPackagesResponse struct {
	Total  int               `json:"total"`
	Page   int               `json:"page"`
	Pages  int               `json:"pages"`
	Limit  int               `json:"limit"`
	Offset int               `json:"offset"`
	Items  []WorkPackageItem `json:"items"`
}

type CustomFieldItem struct {
	Name  string `json:"name"`
	Value string `json:"value"`
}

type JournalItem struct {
	ID        int        `json:"id"`
	Version   int        `json:"version"`
	Notes     string     `json:"notes"`
	CreatedAt *time.Time `json:"created_at"`
	Author    *string    `json:"author"`
}

type WorkPackageDetail struct {
	ID                int               `json:"id"`
	Subject           string            `json:"subject"`
	Description       *string           `json:"description"`
	Status            string            `json:"status"`
	IsClosed          bool              `json:"is_closed"`
	Type              string            `json:"type"`
	Priority          string            `json:"priority"`
	ProjectID         int               `json:"project_id"`
	Project           string            `json:"project"`
	ProjectIdentifier string            `json:"project_identifier"`
	DueDate           *string           `json:"due_date"`
	StartDate         *string           `json:"start_date"`
	DoneRatio         *int              `json:"done_ratio"`
	EstimatedHours    *float64          `json:"estimated_hours"`
	RemainingHours    *float64          `json:"remaining_hours"`
	SpentHours        float64           `json:"spent_hours"`
	CreatedAt         *time.Time        `json:"created_at"`
	UpdatedAt         *time.Time        `json:"updated_at"`
	DaysOverdue       int               `json:"days_overdue"`
	Assignee          *string           `json:"assignee"`
	Author            *string           `json:"author"`
	CustomFields      []CustomFieldItem `json:"custom_fields"`
	Journals          []JournalItem     `json:"journals"`
}

type WorkloadItem struct {
	Name        string `json:"name"`
	OpenTasks   int    `json:"open_tasks"`
	ClosedTasks int    `json:"closed_tasks"`
	TotalTasks  int    `json:"total_tasks"`
}

type ProjectHoursItem struct {
	ID             int     `json:"id"`
	Name           string  `json:"name"`
	EstimatedHours float64 `json:"estimated_hours"`
	SpentHours     float64 `json:"spent_hours"`
}

type UserHoursItem struct {
	UserName   string  `json:"user_name"`
	TotalHours float64 `json:"total_hours"`
	LogCount   int     `json:"log_count"`
}

type TimeTrackingResponse struct {
	ByProject []ProjectHoursItem `json:"by_project"`
	ByUser    []UserHoursItem    `json:"by_user"`
}

type MilestoneItem struct {
	ID        int     `json:"id"`
	Subject   string  `json:"subject"`
	DueDate   *string `json:"due_date"`
	StartDate *string `json:"start_date"`
	DoneRatio *int    `json:"done_ratio"`
	Project   string  `json:"project"`
	Status    string  `json:"status"`
	IsClosed  bool    `json:"is_closed"`
}

type VersionItem struct {
	ID            int     `json:"id"`
	Name          string  `json:"name"`
	Status        string  `json:"status"`
	EffectiveDate *string `json:"effective_date"`
	Project       string  `json:"project"`
	WpCount       int     `json:"wp_count"`
	ClosedCount   int     `json:"closed_count"`
}

type CompletionItem struct {
	ID      int     `json:"id"`
	Project string  `json:"project"`
	Total   int     `json:"total"`
	Closed  int     `json:"closed"`
	AvgDone float64 `json:"avg_done"`
}

type ReportStats struct {
	TotalItems          int     `json:"total_items"`
	BugCount            int     `json:"bug_count"`
	StoryCount          int     `json:"story_count"`
	TaskCount           int     `json:"task_count"`
	FeatureCount        int     `json:"feature_count"`
	OnHoldCount         int     `json:"on_hold_count"`
	RejectedCount       int     `json:"rejected_count"`
	OverdueCount        int     `json:"overdue_count"`
	ClosedCount         int     `json:"closed_count"`
	TotalEstimatedHours float64 `json:"total_estimated_hours"`
}

type TopProjectReport struct {
	ID      int     `json:"id"`
	Name    string  `json:"name"`
	Total   int     `json:"total"`
	Closed  int     `json:"closed"`
	AvgDone float64 `json:"avg_done"`
}

type ReportsSummaryResponse struct {
	Stats           ReportStats        `json:"stats"`
	TotalSpentHours float64            `json:"total_spent_hours"`
	TopProjects     []TopProjectReport `json:"top_projects"`
}

type ReleasePipelineSummary struct {
	ReadyToProdTotal int `json:"ready_to_prod_total"`
	UATTotal         int `json:"uat_total"`
	DevelopedTotal   int `json:"developed_total"`
	ProjectsCount    int `json:"projects_count"`
}

type ReleaseProjectItem struct {
	ProjectID        int    `json:"project_id"`
	ProjectName      string `json:"project_name"`
	Identifier       string `json:"identifier"`
	ReadyToProdCount int    `json:"ready_to_prod_count"`
	UATCount         int    `json:"uat_count"`
	DevelopedCount   int    `json:"developed_count"`
	TotalPipeline    int    `json:"total_pipeline"`
}

type ReleasePipelineItem struct {
	ID                int        `json:"id"`
	Subject           string     `json:"subject"`
	Status            string     `json:"status"`
	Stage             string     `json:"stage"` // "ready_to_prod", "uat", "developed"
	Type              string     `json:"type"`
	Priority          string     `json:"priority"`
	ProjectID         int        `json:"project_id"`
	Project           string     `json:"project"`
	ProjectIdentifier string     `json:"project_identifier"`
	Assignee          *string    `json:"assignee"`
	DueDate           *string    `json:"due_date"`
	UpdatedAt         *time.Time `json:"updated_at"`
	DoneRatio         *int       `json:"done_ratio"`
}

type ReleasePipelineResponse struct {
	Summary  ReleasePipelineSummary `json:"summary"`
	Projects []ReleaseProjectItem   `json:"projects"`
	Items    []ReleasePipelineItem  `json:"items"`
}
