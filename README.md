# TOP Project Dashboard

Dashboard manajemen project modern berbasis data live dari OpenProject (PostgreSQL), dibangun dengan **Golang (Gin)** di sisi backend dan **Next.js (App Router, TypeScript, Tailwind CSS)** di sisi frontend.

---

## Struktur Project

```
Dashboard Project Managemen/
├── backend/                  # Golang REST API Server
│   ├── config/
│   │   └── database.go       # Koneksi PostgreSQL & Connection Pool
│   ├── handlers/
│   │   └── handlers.go       # Controller semua endpoint API
│   ├── models/
│   │   └── models.go         # Definisi struct & schema data
│   ├── .env                  # Konfigurasi database PostgreSQL
│   ├── go.mod                # Dependensi Go
│   ├── go.sum
│   └── main.go               # Entry point server Golang
├── frontend/                 # Next.js Application
│   ├── app/
│   │   ├── api-client.ts     # Client HTTP service
│   │   ├── types.ts          # TypeScript interfaces
│   │   ├── globals.css       # Tailwind CSS & Theme variables
│   │   ├── layout.tsx
│   │   └── page.tsx          # Single Page Application Dashboard
│   ├── package.json          # Dependensi Next.js & React
│   └── tsconfig.json
├── backend-python/           # Arsip backup backend Python (FastAPI)
├── frontend-vanilla/         # Arsip backup frontend Vanilla JS
└── README.md
```

---

## Prasyarat

- **Go**: 1.22+
- **Node.js**: 18+ (disarankan Node.js 20+)
- **NPM**: 9+
- Akses ke database PostgreSQL OpenProject (`103.196.155.36:35433`)

---

## Cara Menjalankan

### 1. Menjalankan Backend (Golang)

Buka terminal dan masuk ke folder `backend`:

```powershell
cd backend
go run main.go
```

Server backend akan berjalan di:
- **API URL**: `http://localhost:8000`
- **Health Check**: `http://localhost:8000/health`

Konfigurasi koneksi database disimpan di [backend/.env](file:///d:/Project/Dashboard%20Project%20Managemen/backend/.env):
```env
DB_HOST=103.196.155.36
DB_PORT=35433
DB_NAME=openproject
DB_USER=openproject
DB_PASSWORD=rstHx9FRV83Niu732A6j
```

---

### 2. Menjalankan Frontend (Next.js)

Buka terminal baru dan masuk ke folder `frontend`:

```powershell
cd frontend
npm run dev
```

Buka browser di:
- **Dashboard URL**: `http://localhost:3000`

### Akun Login Demo (Diferensiasi Peran)

| Peran (Role) | Username | Password | Hak Akses Utama |
|---|---|---|---|
| 👑 **Administrator** | `admin` | `admin123` | Akses penuh seluruh sistem, kontrol pengguna, pengaturan proyek |
| 💼 **Project Manager** | `pm` | `pm123` | Operasional proyek, work packages, workload, milestones, analitik |
| 💻 **Anggota Tim / Dev** | `member` | `member123` | Overview, repositori project, work packages tiket, beban kerja |
| 👁️ **Direksi / Viewer** | `viewer` | `viewer123` | Read-only Executive Overview, milestones & roadmap, laporan analitik |

> *Catatan: Pada halaman login juga tersedia tombol **1-Click Login** untuk setiap akun di atas.*

> Untuk build mode produksi:
> ```powershell
> cd frontend
> npm run build
> npm run start
> ```

---

## Fitur Unggulan Dashboard

| Fitur | Keterangan |
|---|---|
| **Global Project Filter** | Dropdown pemilih project di bar navigasi atas. Semua kartu KPI, chart, task, milestone, dan workload otomatis tersaring khusus untuk project terpilih atau global. |
| **Executive Overview** | Ringkasan 6 KPI penting, volume bulanan (12 bulan terakhir), distribusi status donut chart, tipe pekerjaan, prioritas, dan aktivitas terkini. |
| **Interaktif Overdue Card 🚨** | Kartu *Overdue* pada overview dapat diklik langsung untuk menuju halaman daftar task yang terlambat. |
| **Projects Management** | Indikator kesehatan otomatis (**🟢 On Track**, **🟡 At Risk**, **🔴 Needs Attention**), estimasi jam vs realisasi jam, pencarian project, dan tombol **📥 Export CSV**. |
| **Work Packages** | Query SQL berkinerja tinggi dengan pagination (*Previous/Next*, info halaman dan total item), tab filter status (Termasuk filter *Overdue*), pencarian teks instan, dan **Modal Detail Work Package** (deskripsi, custom fields seperti UAT Date/Menu/Endpoint, log riwayat update). |
| **Milestones & Sprints** | Pantauan milestone aktif beserta tanggal deadline, status, progress %, serta versi rilis sprint per project. |
| **Workload & Hours Tracking** | Grafik beban kerja per anggota tim, jam kerja aktual per user dari time entries, dan tabel **Estimasi vs Realisasi Waktu (Budget Tracking)** dengan rasio persentase dan badge *On Track / Near Budget / Over Budget*. |
| **Analitik & Laporan** | 100% dinamis terhubung ke database PostgreSQL tanpa nilai hardcoded (Bug, User Story, On Hold, Rejected, Total Estimasi Jam, Total Jam Log), serta grafik Top 10 Project. |
| **Multi-Role Authentication** | Sistem autentikasi login dashboard mandiri berbasis token JWT dan bcrypt. Membedakan 4 level peran pengguna (**Administrator**, **Project Manager**, **Anggota Tim / Developer**, **Viewer / Direksi**) dengan proteksi akses menu, profil pengguna aktif di sidebar, dan tombol **Pilih Cepat Akun Demo (1-Click Login)**. |
| **User Management** | Manajemen pengguna lengkap dengan 2 sub-tab: **Akun Login Dashboard** (kelola hak akses login, role, tambah akun, ganti password) dan **Anggota Tim OpenProject** (statistik KPI, data 20 tim live, tasks, jam log, dan **📥 Export CSV**). |
| **Dark Mode & Responsive** | Dukungan Dark Mode dan Light Mode instan dengan layout responsif untuk desktop, tablet, dan smartphone. |

---

## API Endpoints (Golang)

| Method | Path | Parameter | Keterangan |
|---|---|---|---|
| GET | `/health` | — | Health check backend |
| GET | `/api/meta/filters` | — | Metadata filter (daftar project, status, tipe, prioritas) |
| GET | `/api/kpi` | `project_id` | KPI utama, close rate, overdue, in progress, on hold, rejected |
| GET | `/api/status-distribution` | `project_id` | Jumlah item per status |
| GET | `/api/type-distribution` | `project_id` | Jumlah item per tipe pekerjaan |
| GET | `/api/priority-distribution`| `project_id` | Jumlah item per prioritas |
| GET | `/api/monthly-volume` | `project_id` | Volume item dibuat per bulan (12 bulan terakhir) |
| GET | `/api/projects` | `search` | Daftar project aktif lengkap dengan status kesehatan & perbandingan jam |
| GET | `/api/work-packages` | `project_id`, `status`, `priority`, `type`, `is_overdue`, `search`, `limit`, `offset`, `sort_by`, `sort_dir` | Daftar item dengan SQL filtering & pagination |
| GET | `/api/work-packages/:id` | — | Detail lengkap work package, custom fields, spent hours & journals |
| GET | `/api/workload` | `project_id` | Open vs closed tasks per anggota tim |
| GET | `/api/time-tracking` | `project_id` | Perbandingan estimasi vs realisasi jam per project & per user |
| GET | `/api/reports-summary` | `project_id` | Rangkuman analitik dinamis bebas nilai hardcoded |
| GET | `/api/milestones` | `project_id` | Daftar milestone per project |
| GET | `/api/versions` | `project_id` | Daftar sprint / versi rilis per project |
| POST | `/api/auth/login` | `username`, `password` | Autentikasi pengguna & generate JWT token |
| GET | `/api/auth/me` | Bearer Token | Cek info sesi akun login saat ini |
| POST | `/api/auth/logout` | — | Keluar dari sesi dashboard |
| GET | `/api/dashboard-users` | `search`, `role` | Daftar akun yang memiliki akses login ke dashboard |
| POST | `/api/dashboard-users` | body JSON | Tambah akun login dashboard baru beserta rolenya |
| PUT | `/api/dashboard-users/:id` | body JSON | Edit data akun, ganti role, password, atau status keaktifan |
| DELETE | `/api/dashboard-users/:id` | — | Hapus akun login dashboard |
| GET | `/api/completion` | `project_id` | Rasio penyelesaian per project |
| GET | `/api/release-pipeline` | `project_id` | Pipeline rilis (Ready to Prod, UAT, Developed) |
| GET | `/api/users` | `search`, `status`, `role`, `project_id` | Daftar pengguna dengan ringkasan KPI, task counts, spent hours & projects |
| GET | `/api/users/:id` | — | Detail profil pengguna, daftar project & peran, work packages, dan time entries |
| POST | `/api/users` | body JSON | Tambah pengguna baru dengan hash password bcrypt |
| PUT | `/api/users/:id` | body JSON | Perbarui profil, hak akses admin, status, atau password pengguna |
| DELETE | `/api/users/:id` | — | Nonaktifkan / kunci akun pengguna dengan aman (status = 3) |

---

## Backup Kode Lama

Kode sebelumnya telah dicadangkan secara aman di:
- `backend-python/`: Backend lama menggunakan Python (FastAPI + psycopg2)
- `frontend-vanilla/`: Frontend lama menggunakan HTML/JS/CSS murni
