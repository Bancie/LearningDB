<!-- PER-3983: copy into BackupSGU26_ML as Lab_03/MARIMO_PIMA_OUTLINE.md -->

# Marimo app outline — Pima Indians Diabetes (Lab 03)

High-level cell map for a **marimo** notebook/app: **EDA**, **preprocessing**, and **ML experiments** (dataset: `Lab_03/data/pima-indians-diabetes.csv` in **BackupSGU26_ML**).  
Chỉ **sườn cấu trúc** — không triển khai logic hay code chi tiết.

---

## Cell map (theo thứ tự)

| # | Section | Gợi ý loại cell | Nội dung cell (cấp cao) |
|---|---------|-----------------|-------------------------|
| 1 | **Imports & configuration** | Code (+ optional `mo.md`) | Import thư viện dùng cho load, EDA, viz, sklearn/pandas; hằng số đường dẫn file, seed, style plot (nếu có). |
| 2 | **Data loading** | Code | Đọc CSV; gán tên cột theo `pima-indians-diabetes.names` (nếu dùng); preview (`head`, `shape`, `dtypes`). |
| 3 | **Problem definition** | `mo.md` | Input: các feature y tế/số đo; output: nhị phân (có/không tiểu đường). Loại bài toán: **binary classification**. |
| 4 | **EDA** | Code (+ `mo.md` ngắn) | Thống kê mô tả; missing / duplicates; phân bố (histogram/box theo nhóm); ma trận tương quan. |
| 5 | **Data visualization** | Code | Biểu đồ đơn biến; biểu đồ đa biến (scatter pair, heatmap, v.v.) — chỉ khung, chưa cần chỉnh sửa dữ liệu. |
| 6 | **Data cleaning** | Code | Xử lý missing; loại duplicate; (optional) bỏ cột không dùng — ghi chú quyết định ở markdown cell liền kề nếu cần. |
| 7 | **Data transformation** | Code | Encoding biến phân loại (nếu có thêm sau này); one-hot khi cần; giữ `X` / `y` tách bạch. |
| 8 | **Feature scaling** | Code | Min–Max hoặc StandardScaler trên tập feature (fit sau khi split hoặc chỉ ghi chú pipeline — triển khai sau). |
| 9 | **Data splitting** | Code | `train_test_split` (hoặc CV outline); tỷ lệ và `random_state` trong config. |
| 10 | **Model experimentation** | `mo.md` + Code (placeholder) | Khung: danh sách mô hình dự kiến (logistic, tree, …); ô code để trống hoặc `pass` / comment — **chưa huấn luyện**. |
| 11 | **Results & insights** | `mo.md` + Code (placeholder) | Khung báo cáo metrics (accuracy, ROC, confusion matrix); insight ngắn — **chưa điền số liệu**. |

---

## Gợi ý triển khai marimo

- Mỗi mục **1–2 cell**: một `mo.md` (mục tiêu / checklist) + một code cell (khung).
- Giữ biến `df`, `X`, `y` nhất quán qua các cell reactive.
- File app gợi ý: `Lab_03/pima_diabetes_eda.py` (tạo sau khi chốt outline).

---

## Checklist nhanh (khi code sau)

- [ ] Đường dẫn dataset trỏ tới `Lab_03/data/pima-indians-diabetes.csv`
- [ ] Kiểm tra giá trị 0 / sentinel theo domain (ghi chú trong EDA)
- [ ] Không leak: scale / fit chỉ trên train (khi làm bước 8–10)
