# RDM
```mermaid
---
title: study
---
erDiagram
    MONHOC {
        MAMH VARCHAR(6) PK
        TENMH NVARCHAR(100)
        HOCKI INT
        TINCHI INT
        KIENTHUC VARCHAR(50)
    }

    SINHVIEN {
        MSSV VARCHAR(10) PK
        HOTEN NVARCHAR(100)
        GPA FLOAT
        XEPLOAI NVARCHAR(50)
    }

    KETQUA {
        MSSV VARCHAR(10) PK, FK
        MAMH VARCHAR(6) PK, FK
        DIEM FLOAT
    }

    SINHVIEN ||--o{ KETQUA : has
    MONHOC   ||--o{ KETQUA : includes
```