# TOP Project Dashboard

Dashboard manajemen project berbasis data live dari OpenProject (PostgreSQL), dibangun dengan **FastAPI** (backend) dan **HTML/JS murni** (frontend).

---

## Struktur Project

```
Dashboard Project Managemen/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── database.py       # Koneksi PostgreSQL
│   │   └── main.py           # Semua endpoint API
│   ├── .env                  # Konfigurasi database (tidak di-commit)
│   ├── requirements.txt      # Dependensi Python
│   └── run.py                # Entry point server
├── frontend/
│   └── index.html            # Dashboard SPA
└── README.md
```

---

## Prasyarat

- Python 3.10+
- Akses ke database PostgreSQL OpenProject
- Browser modern (Chrome, Firefox, Edge)

---

## Instalasi & Menjalankan

### 1. Clone / buka folder project

```bash
cd "d:\Project\Dashboard Project Managemen"
```

### 2. Install dependensi backend

```bash
cd backend
pip install -r requirements.txt
```

### 3. Konfigurasi database

File `.env` sudah tersedia di folder `backend/`. Sesuaikan jika ada perubahan koneksi:

```env
DB_HOST=103.196.155.36
DB_PORT=35433
DB_NAME=openproject
DB_USER=openproject
DB_PASSWORD=rstHx9FRV83Niu732A6j
```

### 4. Jalankan backend

```bash
cd backend
python run.py
```

Server berjalan di: `http://localhost:8000`  
Swagger UI (dokumentasi API): `http://localhost:8000/docs`

### 5. Buka frontend

Buka file berikut langsung di browser:

```
frontend/index.html
```

> Frontend akan otomatis fetch data dari `http://localhost:8000`. Pastikan backend sudah berjalan sebelum membuka frontend.

---

## Fitur Dashboard

| Halaman | Konten & Peningkatan Baru |
|---|---|
| **Global Project Filter** | Dropdown filter di topbar untuk memfilter seluruh dashboard per project atau global |
| **Overview** | KPI utama (proyek, item, closed, in progress, tim), card **Overdue dapat diklik** langsung ke daftar task terlambat, volume bulanan, status donut, tipe & prioritas, aktivitas terbaru |
| **Projects** | Tabel project dengan **Health Status** (🟢 On Track, 🟡 At Risk, 🔴 Needs Attention), estimasi vs realisasi jam, progress, pencarian, dan **Export CSV** |
| **Work Packages** | Akses ke seluruh 760+ item dengan **SQL pagination (Previous/Next)**, filter cepat (🚨 Overdue, Status), search, **Modal Detail Work Package** (custom fields, logs, deskripsi), dan **Export CSV** |
| **Milestones** | Timeline milestone aktif & tabel sprint / versi rilis per project |
| **Workload & Hours** | Beban kerja tim, jam kerja tercatat per anggota tim, dan tabel **Estimasi vs Realisasi Jam (Budget Tracking)** |
| **Reports** | Analitik 100% dinamis (Bug, User Stories, On Hold, Rejected, Total Est. Hours, Total Logged Hours) & Top 10 Project |

---

## API Endpoints

| Method | Path | Parameter | Keterangan |
|---|---|---|---|
| GET | `/api/meta/filters` | — | Metadata filter (daftar project aktif, status, tipe, prioritas) |
| GET | `/api/kpi` | `project_id` | KPI utama, close rate, overdue, in progress, on hold, rejected |
| GET | `/api/status-distribution` | `project_id` | Jumlah item per status |
| GET | `/api/type-distribution` | `project_id` | Jumlah item per tipe |
| GET | `/api/priority-distribution`| `project_id` | Jumlah item per prioritas |
| GET | `/api/monthly-volume` | `project_id` | Volume item dibuat per bulan (12 bulan terakhir) |
| GET | `/api/projects` | `search` | Daftar project aktif lengkap dengan indikator kesehatan & jam kerja |
| GET | `/api/work-packages` | `project_id`, `status`, `priority`, `type`, `is_overdue`, `search`, `limit`, `offset`, `sort_by`, `sort_dir` | Daftar item dengan SQL filtering & pagination |
| GET | `/api/work-packages/{id}` | — | Detail lengkap work package, custom fields, spent hours & journals |
| GET | `/api/workload` | `project_id` | Open vs closed tasks per anggota tim |
| GET | `/api/time-tracking` | `project_id` | Perbandingan estimasi vs realisasi jam per project & per user |
| GET | `/api/reports-summary` | `project_id` | Rangkuman analitik dinamis bebas nilai hardcoded |
| GET | `/api/milestones` | `project_id` | Daftar milestone per project |
| GET | `/api/versions` | `project_id` | Daftar sprint / versi per project |
| GET | `/api/completion` | `project_id` | Rasio penyelesaian per project |

---

## Teknologi

**Backend**
- [FastAPI](https://fastapi.tiangolo.com/) — framework REST API
- [psycopg2](https://pypi.org/project/psycopg2-binary/) — driver PostgreSQL
- [python-dotenv](https://pypi.org/project/python-dotenv/) — konfigurasi env
- [uvicorn](https://www.uvicorn.org/) — ASGI server

**Frontend**
- HTML5 / CSS3 / Vanilla JavaScript — tanpa framework
- [Inter & Space Grotesk](https://fonts.google.com/) — tipografi via Google Fonts
- Fetch API — komunikasi ke backend
- Mendukung dark/light mode & mobile responsive

**Database**
- PostgreSQL 14 (OpenProject) — host `103.196.155.36:35433`

---

## Troubleshooting

**Backend gagal start**
```
ModuleNotFoundError: No module named 'psycopg2'
```
Jalankan: `pip install psycopg2-binary --force-reinstall`

**Frontend menampilkan error koneksi**
```
⚠ Gagal memuat: Failed to fetch
```
Pastikan backend sudah berjalan di `localhost:8000` sebelum membuka `index.html`.

**CORS error di browser**
Backend sudah dikonfigurasi `allow_origins=["*"]`. Jika masih error, coba buka frontend via server lokal:
```bash
cd frontend
python -m http.server 3000
# Buka: http://localhost:3000
```
