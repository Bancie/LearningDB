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
FROM NHANVIEN
WHERE (LUONG > 25000 AND PHG = 4) OR (LUONG > 30000 AND PHG = 5)

-- Câu 4. Cho biết họ tên đầy đủ của các nhân viên có họ bắt đầu bằng ký tự 'N'

SELECT HONV + ' ' + TENLOT + ' ' + TENNV AS HOVATEN
FROM NHANVIEN
WHERE HONV LIKE 'N%'

-- Câu 5. Cho biết các nhân viên sinh trước năm 1975

SELECT *
FROM NHANVIEN
WHERE NGSINH < '1975-01-01'

-- Câu 6. Cho biết các nhân viên sinh trước ngày 30/4/1975 hoặc ở TP HCM hoặc làm việc tại phòng số 4

SELECT *
FROM NHANVIEN
WHERE (NGSINH < '1975-4-30') OR (DCHI LIKE '%HCM%') OR (PHG = 4)

-- Câu 7. Với mỗi phòng ban, cho biết tên phòng ban và địa điểm phòng

SELECT PB.MAPHG, TENPHG, DIADIEM
FROM PHONGBAN PB, DIADIEM_PHG DD
WHERE PB.MAPHG = DD.MAPHG

-- Câu 8. Tìm tên những người trưởng phòng của từng phòng ban

SELECT MAPHG, TENNV AS TEN_TRPHG
FROM PHONGBAN, NHANVIEN
WHERE TRPHG = MANV

-- Câu 9. Tìm tên và địa chỉ của tất cả các nhân viên của phòng "Nghiên cứu"

SELECT TENNV, DCHI
FROM PHONGBAN, NHANVIEN
WHERE TENPHG LIKE N'%Nghiên cứu%'

-- Câu 10. Với mọi đề án ở "Ha Noi", liệt kê các mã số đề án (MADA), mã số phòng ban chủ trì đề án (PHONG), họ tên trưởng phòng (HONV, TENLOT, TENNV) cũng như địa chỉ (DCHI) và ngày sinh (NGSINH) của người ấy.

SELECT MADA, PHONG, HONV + ' ' + TENLOT + ' ' + TENNV AS HOVATEN_TRPHG, DCHI, NGSINH
FROM DEAN, PHONGBAN PB, NHANVIEN
WHERE (DDIEM_DA LIKE N'%Ha Noi%') AND (PHONG = PB.MAPHG) AND (TRPHG = MANV)

SELECT MA_NVIEN, COUNT(*) sl_dean
from PHANCONG
GROUP BY MA_NVIEN
HAVING COUNT(*) >= 0
ORDER BY sl_dean DESC

SELECT TENPHG, AVG(LUONG) luong
FROM NHANVIEN, PHONGBAN
WHERE MAPHG = PHG
GROUP BY TENPHG
HAVING AVG(LUONG) > 20000

-- PHONG BAN CO LUONG TB CAO NHAT

SELECT TENPHG, AVG(LUONG) luong
FROM NHANVIEN, PHONGBAN
WHERE MAPHG = PHG
GROUP BY TENPHG
HAVING AVG(LUONG) >= ALL (
    SELECT AVG(LUONG)
    FROM NHANVIEN
    GROUP BY PHG
)

-- 11. Cho biết tên các đề án mà nhân viên Tran Thi Linh đã tham gia

SELECT TENDA
FROM NHANVIEN
JOIN PHONGBAN ON PHG = MAPHG
JOIN DEAN ON PHONG = MAPHG
WHERE HONV + ' ' + TENLOT + ' ' + TENNV = 'Tran Thi Linh';

-- 12. Cho biết số lượng đề án của công ty

SELECT COUNT(MADA) AS SLDA
FROM DEAN

-- 13. Cho biết số lượng đề án do phòng 'Nghiên Cứu' chủ trì

SELECT *
FROM PHONGBAN

SELECT COUNT(MADA) AS SLDA
FROM DEAN JOIN PHONGBAN ON PHONG = MAPHG

-- 15. Với mỗi nhân viên, cho biết số lượng nhân viên mà nhân viên đó quản lý trực tiếp.

SELECT MA_NQL, COUNT(MANV) AS SL
FROM NHANVIEN
GROUP BY MA_NQL