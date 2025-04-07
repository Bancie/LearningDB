USE quanlydean;
GO

-- Câu 1. Tìm những nhân viên làm việc ở phòng số 4

SELECT *
FROM NHANVIEN
WHERE PHG = 4

-- Câu 2. Tìm những nhân viên có mức lương trên 30000

SELECT *
FROM NHANVIEN
WHERE LUONG > 30000

-- Câu 3. Tìm các nhân viên có mức lương trên 25,000 ở phòng 4 hoặc các nhân viên có mức lương trên 30,000 ở phòng 5

SELECT *
