# LearningDB Web Application

Ứng dụng web theo dõi hoạt động học tập hàng ngày với tính năng phân tích Bayesian.

## Mục lục

- [Tổng quan](#tổng-quan)
- [Kiến trúc hệ thống](#kiến-trúc-hệ-thống)
- [Cấu trúc thư mục](#cấu-trúc-thư-mục)
- [Cài đặt và Chạy](#cài-đặt-và-chạy)
- [Backend API](#backend-api)
- [Frontend Routes](#frontend-routes)
- [Database Schema](#database-schema)
- [Tính năng chi tiết](#tính-năng-chi-tiết)
- [Phát triển và Mở rộng](#phát-triển-và-mở-rộng)

---

## Tổng quan

LearningDB là một ứng dụng web full-stack được upgrade từ desktop app Tkinter, giúp:

- Theo dõi các hoạt động học tập hàng ngày
- Nhập dữ liệu vào các bảng MySQL
- Phân tích và tính toán xác suất Bayesian
- Quản lý trạng thái và ưu tiên của các hoạt động

### Tech Stack

| Layer        | Technology                                                |
| ------------ | --------------------------------------------------------- |
| **Frontend** | React 19, React Router 7, Material UI (MUI) 7, TypeScript |
| **Backend**  | Python 3, FastAPI, SQLAlchemy, Pandas                     |
| **Database** | MySQL                                                     |
| **Styling**  | TailwindCSS, MUI Theme                                    |

---

## Kiến trúc hệ thống

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                         │
│                     http://localhost:5173                        │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ HTTP Requests
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React Router)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Layout    │  │   Routes    │  │     API Service         │  │
│  │  (MUI)      │  │  (Pages)    │  │  (Axios → Backend)      │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ REST API (JSON)
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (FastAPI)                             │
│                    http://localhost:8000                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   main.py   │  │   crud.py   │  │     database.py         │  │
│  │  (Routes)   │  │  (Logic)    │  │  (SQLAlchemy Engine)    │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ SQL Queries
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE (MySQL)                              │
│                    localhost:3306                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  ACTIVITY   │  │ ACTIVITY_LOG│  │   Other Tables...       │  │
│  │  (Core)     │  │  (Tracking) │  │   (SLEEP_LOG, etc.)     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Cấu trúc thư mục

```
learningdb/
├── app/                          # Frontend React Application
│   ├── components/               # Reusable Components
│   │   └── Layout.tsx            # Main layout với MUI Drawer
│   ├── routes/                   # Page Components (React Router)
│   │   ├── home.tsx              # Trang chủ Dashboard
│   │   ├── import.tsx            # Import Data - nhập dữ liệu
│   │   ├── activity-log.tsx      # Current Activity Log
│   │   ├── activity-output.tsx   # Current Activity Output
│   │   ├── activity-list.tsx     # Activity List với Search/Filter/Sort
│   │   ├── update.tsx            # Update Data (probabilities, status)
│   │   ├── view.tsx              # View Activities (Bayes view)
│   │   └── bayes.tsx             # Run Bayes Analysis
│   ├── services/                 # API Services
│   │   └── api.ts                # Axios API client
│   ├── routes.ts                 # Route configuration
│   ├── root.tsx                  # Root component
│   └── app.css                   # Global styles
│
├── backend/                      # Backend Python Application
│   ├── main.py                   # FastAPI application & endpoints
│   ├── crud.py                   # Database CRUD operations
│   ├── database.py               # SQLAlchemy engine & connection
│   ├── requirements.txt          # Python dependencies
│   └── .venv/                    # Python virtual environment (not in git)
│
├── public/                       # Static assets
├── package.json                  # Node.js dependencies
├── tsconfig.json                 # TypeScript configuration
├── vite.config.ts                # Vite configuration
└── README.md                     # Documentation (this file)
```

---

## Cài đặt và Chạy

### Yêu cầu

- Node.js 18+
- Python 3.10+
- MySQL Server

### 1. Cấu hình Database

Tạo file `.env` ở thư mục gốc (`LearningDB/.env`):

```env
DB_USER=root
DB_PASS=your_password
DB_HOST=localhost
DB_NAME=bancie
```

### 2. Cài đặt Backend

```bash
# Di chuyển vào thư mục backend
cd learningdb/backend

# Tạo virtual environment (theo FastAPI: https://fastapi.tiangolo.com/virtual-environments/)
python3 -m venv .venv

# Kích hoạt .venv
source .venv/bin/activate  # macOS/Linux
# hoặc: .venv\Scripts\activate  # Windows

# (Tùy chọn) Nâng cấp pip
python -m pip install --upgrade pip

# Cài đặt dependencies
pip install -r requirements.txt
```

**Lưu ý:** Thư mục `.venv/` đã được thêm vào `.gitignore` (và `learningdb/backend/.gitignore`), nên sẽ không bị commit lên Git. Nếu bạn đang dùng `venv` cũ, có thể xóa và tạo lại với `.venv`: `rm -rf venv` rồi chạy lại các lệnh tạo và kích hoạt `.venv` ở trên.

### 3. Cài đặt Frontend

```bash
# Di chuyển vào thư mục learningdb
cd learningdb

# Cài đặt npm packages
npm install
```

### 4. Cài CLI `learningdb`

```bash
# Từ thư mục gốc project
cd learningdb/backend
source .venv/bin/activate
pip install -e .
```

### 5. Chạy ứng dụng (1 lệnh local)

```bash
# Từ thư mục gốc project
source learningdb/backend/.venv/bin/activate
learningdb serve
```

Mặc định lệnh trên sẽ:

- Kiểm tra `.env` và kết nối MySQL local
- Chạy backend FastAPI ở `http://localhost:8000`
- Chạy frontend dev server (HMR) ở `http://localhost:5173`

Chế độ gần production:

```bash
learningdb serve --prod
```

### 6. Truy cập

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs (Swagger UI)

---

## Chạy bằng Docker Compose (1 lệnh)

`LearningDB` đã được cấu hình để chạy full stack bằng file `compose.yml` ở thư mục gốc project.

### Yêu cầu trước khi chạy

- Đảm bảo volume dữ liệu hiện có là `bancie-mysql-data`.
- Không để MySQL cũ chạy đồng thời cùng volume đó (tránh lock/corrupt data).
- Cổng DB host dùng mặc định `3308` để tránh đụng `3306/3307` đang dùng.
- Không dùng `docker compose down -v` nếu muốn giữ dữ liệu.

### Chạy stack

```bash
cd ..
docker compose up --build
```

### Endpoint sau khi chạy

- **Web**: `http://localhost:3000`
- **API**: `http://localhost:8000`
- **API Docs**: `http://localhost:8000/docs`
- **Orchestrator Health**: `http://localhost:8100/health`
- **Orchestrator Providers**: `http://localhost:8100/providers`
- **MySQL (host)**: `localhost:3308`

### Kiểm tra an toàn trước khi start

```bash
# 1) Xác nhận volume tồn tại
docker volume ls | grep bancie-mysql-data

# 2) Dừng container MySQL cũ nếu đang dùng cùng volume
docker ps --format '{{.Names}}' | grep bancie-mysql && docker stop bancie-mysql

# 3) Start compose
docker compose up --build
```

### Kiểm tra dữ liệu sau restart

```bash
docker compose down
docker compose up -d
```

Sau khi lên lại, kiểm tra dữ liệu trong DB hoặc qua màn hình ứng dụng để xác nhận dữ liệu vẫn còn.

### Reset volume DB (xóa toàn bộ dữ liệu)

```bash
docker compose down
docker volume rm bancie-mysql-data
```

---

## Backend API

### Base URL

```
http://localhost:8000/api
```

### Endpoints

#### Table Operations

| Method | Endpoint                       | Mô tả                           |
| ------ | ------------------------------ | ------------------------------- |
| GET    | `/tables`                      | Lấy danh sách tất cả tables     |
| GET    | `/tables/{table_name}/columns` | Lấy thông tin columns của table |
| POST   | `/tables/insert`               | Insert record vào table         |

#### Activity Operations

| Method | Endpoint                               | Mô tả                       |
| ------ | -------------------------------------- | --------------------------- |
| GET    | `/activities`                          | Lấy danh sách Activity IDs  |
| GET    | `/activities/list/{user_id}`           | Lấy Activity List của user  |
| GET    | `/activities/view/{user_id}`           | Lấy Bayes view của user     |
| GET    | `/activities/current-log/{user_id}`    | Lấy Current Activity Log    |
| GET    | `/activities/current-output/{user_id}` | Lấy Current Activity Output |

#### Update Operations

| Method | Endpoint            | Mô tả                               |
| ------ | ------------------- | ----------------------------------- |
| POST   | `/update/prior`     | Cập nhật Prior Probability          |
| POST   | `/update/posterior` | Cập nhật Posterior Probability      |
| POST   | `/update/status`    | Cập nhật Activity Status            |
| POST   | `/update/zero`      | Zero out non-in_progress activities |

#### Bayes Operations

| Method | Endpoint             | Mô tả                     |
| ------ | -------------------- | ------------------------- |
| GET    | `/bayes/check-prior` | Kiểm tra tổng Prior = 1.0 |
| GET    | `/bayes/run`         | Chạy Bayesian Analysis    |

### Request/Response Examples

**Insert Record:**

```json
POST /api/tables/insert
{
  "table_name": "ACTIVITY",
  "data": {
    "ACT_NAME": "New Activity",
    "USER_ID": 1,
    "ACT_STATUS": "in_progress"
  }
}
```

**Run Bayes:**

```json
GET /api/bayes/run?total_minute=120

Response:
{
  "data": [
    {
      "ACTIVITY_ID": 1,
      "ACT_NAME": "Activity Name",
      "Total": 0.25,
      "Learning": 0.15,
      "Overview": 0.05,
      "Practice": 0.05
    }
  ]
}
```

---

## Frontend Routes

| Path               | Component             | Chức năng                                |
| ------------------ | --------------------- | ---------------------------------------- |
| `/`                | `home.tsx`            | Dashboard với các feature cards          |
| `/import`          | `import.tsx`          | Nhập dữ liệu vào bất kỳ table nào        |
| `/activity-log`    | `activity-log.tsx`    | Xem Current Activity Log                 |
| `/activity-output` | `activity-output.tsx` | Xem Current Activity Output              |
| `/activity-list`   | `activity-list.tsx`   | Xem Activity List với Search/Filter/Sort |
| `/update`          | `update.tsx`          | Cập nhật probabilities và status         |
| `/view`            | `view.tsx`            | Xem Bayes probabilities                  |
| `/bayes`           | `bayes.tsx`           | Chạy Bayesian Analysis                   |

---

## Database Schema

### Core Tables

#### ACTIVITY

```sql
- ACTIVITY_ID (PK, AUTO_INCREMENT)
- USER_ID (FK)
- ACT_NAME
- ACT_STATUS (ENUM: not_started, in_progress, paused, completed, skipped, cancelled)
- PRIOR_PROB
- POSTERIOR_PROB_LEARNING
- POSTERIOR_PROB_OVERVIEW
- POSTERIOR_PROB_PRACTICE
- CREATED_AT (TIMESTAMP)
- UPDATED_AT (TIMESTAMP)
```

#### ACTIVITY_LOG

```sql
- ACTI_LOG_ID (PK, AUTO_INCREMENT)
- ACTIVITY_ID (FK)
- USER_ID (FK)
- START_TIME (DATETIME)
```

#### ACTIVITY_OUTPUT

```sql
- AO_ID (PK, AUTO_INCREMENT)
- ACTIVITY_ID (FK)
- USER_ID (FK)
- START_TIME (DATETIME)
- FINISH_TIME (DATETIME)
```

### Views

- `bayes_act` - View kết hợp ACTIVITY với USER để hiển thị Bayes data
- `current_activity_log` - View hiển thị activity log hiện tại
- `current_activity_output` - View hiển thị activity output hiện tại

---

## Tính năng chi tiết

### 1. Import Data (`/import`)

- Chọn table từ dropdown (tự động load từ database)
- Form tự động generate dựa trên column types
- Hỗ trợ các input types:
  - **DateTime/Timestamp**: Date picker + nút "Now"
  - **Date**: Date picker + nút "Today"
  - **Enum**: Dropdown select
  - **Boolean**: Select 0/1
  - **Text/Number**: Text input

### 2. Activity List (`/activity-list`)

- **Search**: Tìm kiếm theo tên hoặc ID
- **Filter**: Lọc theo status (in_progress, completed, paused, etc.)
- **Sort**: Sắp xếp theo ID, Name, Status, Created_At
- **Display**: Hiển thị counter số lượng kết quả

### 3. Update Data (`/update`)

- Chọn Activity ID từ danh sách in_progress
- Cập nhật:
  - Status (change activity status)
  - Prior Probability (0-1)
  - Posterior Probability (Learning/Overview/Practice)
- Utilities:
  - "Zero Out Others" - Reset probabilities cho non-in_progress
  - "Check Prior Sum" - Kiểm tra tổng prior = 1.0

### 4. Run Bayes (`/bayes`)

- Nhập Total Minutes (optional)
- Hiển thị kết quả phân tích Bayesian
- Tính toán phân bổ thời gian cho từng activity
- Hiển thị tổng cộng ở cuối bảng

---

## Phát triển và Mở rộng

### Thêm Route mới

1. Tạo file trong `app/routes/new-page.tsx`
2. Thêm route vào `app/routes.ts`:

```typescript
route("new-page", "routes/new-page.tsx"),
```

3. Thêm menu item vào `app/components/Layout.tsx`:

```typescript
{ text: 'New Page', icon: <NewIcon />, path: '/new-page' },
```

### Thêm API Endpoint mới

1. Thêm function vào `backend/crud.py`:

```python
def new_function(param: type) -> list:
    query = text("SELECT ...")
    with engine.connect() as conn:
        df = pd.read_sql(query, conn)
    return df.to_dict(orient='records')
```

2. Thêm endpoint vào `backend/main.py`:

```python
@app.get("/api/new-endpoint")
def new_endpoint():
    return {"data": crud.new_function()}
```

3. Thêm API call vào `app/services/api.ts`:

```typescript
export const newApiCall = () => api.get<{ data: NewType[] }>("/new-endpoint");
```

### Development Commands

```bash
# Full-stack local (recommended)
learningdb serve       # Backend + frontend dev
learningdb serve --prod  # Backend + frontend prod-like

# Frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run typecheck    # Run TypeScript check

# Backend
uvicorn main:app --reload  # Start backend only
```

### Environment Variables

| Variable  | Description    | Default   |
| --------- | -------------- | --------- |
| `DB_USER` | MySQL username | root      |
| `DB_PASS` | MySQL password | -         |
| `DB_HOST` | MySQL host     | localhost |
| `DB_NAME` | Database name  | bancie    |

---

## Troubleshooting

### Backend không kết nối được MySQL

- Kiểm tra MySQL service đang chạy
- Kiểm tra thông tin trong `.env`
- Đảm bảo database `bancie` đã được tạo

### Frontend không gọi được API

- Kiểm tra backend đang chạy ở port 8000
- Kiểm tra CORS settings trong `main.py`
- Mở DevTools > Network để xem lỗi chi tiết

### Port đã được sử dụng

```bash
# Tìm process đang dùng port
lsof -i :5173
lsof -i :8000

# Kill process
kill -9 <PID>
```

---

## License

Private project for personal learning tracking.

---

_Built with React Router + FastAPI + MySQL_
