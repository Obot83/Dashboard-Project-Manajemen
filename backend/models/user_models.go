package models

import "time"

type UserItem struct {
	ID           int        `json:"id"`
	Login        string     `json:"login"`
	FirstName    string     `json:"firstname"`
	LastName     string     `json:"lastname"`
	Name         string     `json:"name"`
	Email        string     `json:"email"`
	Admin        bool       `json:"admin"`
	Status       int        `json:"status"`
	StatusLabel  string     `json:"status_label"`
	CreatedAt    *time.Time `json:"created_at"`
	LastLoginOn  *time.Time `json:"last_login_on"`
	ProjectCount int        `json:"project_count"`
	Projects     []string   `json:"projects"`
	OpenTasks    int        `json:"open_tasks"`
	ClosedTasks  int        `json:"closed_tasks"`
	TotalTasks   int        `json:"total_tasks"`
	SpentHours   float64    `json:"spent_hours"`
}

type UserSummaryKPI struct {
	TotalUsers       int     `json:"total_users"`
	ActiveUsers      int     `json:"active_users"`
	InvitedUsers     int     `json:"invited_users"`
	LockedUsers      int     `json:"locked_users"`
	AdminUsers       int     `json:"admin_users"`
	TotalHoursLogged float64 `json:"total_hours_logged"`
}

type UserProjectMembership struct {
	ProjectID         int        `json:"project_id"`
	ProjectName       string     `json:"project_name"`
	ProjectIdentifier string     `json:"project_identifier"`
	Roles             string     `json:"roles"`
	RoleList          []string   `json:"role_list"`
	CreatedAt         *time.Time `json:"created_at"`
}

type UserTaskItem struct {
	ID          int        `json:"id"`
	Subject     string     `json:"subject"`
	Status      string     `json:"status"`
	IsClosed    bool       `json:"is_closed"`
	Type        string     `json:"type"`
	Priority    string     `json:"priority"`
	ProjectID   int        `json:"project_id"`
	ProjectName string     `json:"project_name"`
	DueDate     *string    `json:"due_date"`
	DoneRatio   *int       `json:"done_ratio"`
	CreatedAt   *time.Time `json:"created_at"`
	UpdatedAt   *time.Time `json:"updated_at"`
}

type UserTimeEntryItem struct {
	ID                 int     `json:"id"`
	Hours              float64 `json:"hours"`
	SpentOn            string  `json:"spent_on"`
	Comments           string  `json:"comments"`
	ProjectID          int     `json:"project_id"`
	ProjectName        string  `json:"project_name"`
	WorkPackageID      *int    `json:"work_package_id"`
	WorkPackageSubject *string `json:"work_package_subject"`
}

type UserDetailResponse struct {
	User        UserItem                `json:"user"`
	Projects    []UserProjectMembership `json:"projects"`
	Tasks       []UserTaskItem          `json:"tasks"`
	TimeEntries []UserTimeEntryItem     `json:"time_entries"`
}

type UsersResponse struct {
	Summary UserSummaryKPI `json:"summary"`
	Users   []UserItem     `json:"users"`
	Total   int            `json:"total"`
}

type CreateUserRequest struct {
	Login     string `json:"login" binding:"required"`
	FirstName string `json:"firstname" binding:"required"`
	LastName  string `json:"lastname"`
	Email     string `json:"email" binding:"required"`
	Admin     bool   `json:"admin"`
	Status    int    `json:"status"` // 1: Active, 4: Invited
	Password  string `json:"password"`
}

type UpdateUserRequest struct {
	FirstName string `json:"firstname"`
	LastName  string `json:"lastname"`
	Email     string `json:"email"`
	Admin     bool   `json:"admin"`
	Status    int    `json:"status"` // 1: Active, 3: Locked, 4: Invited
	Password  string `json:"password,omitempty"`
}
