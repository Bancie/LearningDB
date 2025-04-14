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

SELECT COUNT(MADA) AS SLDA
FROM DEAN JOIN PHONGBAN ON PHONG = MAPHG
WHERE TENPHG = N'Nghiên cứu'

-- 14. Cho biết lương trung bình của các nữ nhân viên

SELECT *
FROM NHANVIEN

SELECT AVG(LUONG) AS LUONG_TB_NU
FROM NHANVIEN
WHERE PHAI = 'Nu'

-- 15. Với mỗi nhân viên, cho biết số lượng nhân viên mà nhân viên đó quản lý trực tiếp.

-- SELECT *
-- FROM NHANVIEN

-- SELECT TENNV 
-- FROM NHANVIEN NV JOIN NHANVIEN QL ON NV.MANV = QL.MA_NQL

-- 16. Với mỗi phòng ban, liệt kê tên phòng ban (TENPHG) và lương trung bình của những nhân viên làm việc cho phòng ban đó.

SELECT TENPHG, AVG(LUONG) AS LUONG_NV
FROM PHONGBAN JOIN NHANVIEN ON MAPHG = PHG
GROUP BY TENPHG

-- 17. Với mỗi phòng ban, cho biết tên phòng ban và số lượng đề án mà phòng ban đó chủ trì

SELECT TENPHG, COUNT(MADA) SLDA
FROM PHONGBAN JOIN DEAN ON MAPHG = PHONG
GROUP BY TENPHG

-- 18. Với mỗi phòng ban, cho biết tên phòng ban, họ tên người trưởng phòng và số lượng đề án mà phòng ban đó chủ trì



-- 19. Với mỗi phòng ban có mức lương trung bình lớn hơn 40,000, cho biết tên phòng ban và số lượng đề án mà phòng ban đó chủ trì.

SELECT TENPHG, COUNT(MADA) SLDA, AVG(LUONG) LUONG
FROM PHONGBAN, NHANVIEN, DEAN
WHERE MAPHG = PHONG AND MAPHG = PHG
GROUP BY TENPHG
HAVING AVG(LUONG) > 10000

-- 20. Cho biết số đề án diễn ra tại từng địa điểm
-- 21. Cho biết danh sách các đề án (MADA) có: nhân công với họ (HONV) là ‘Dinh’ hoặc , có người trưởng phòng chủ trì đề án với họ (HONV) là ‘Dinh’.
-- 22. Danh sách những nhân viên (HONV, TENLOT, TENNV) có trên 2 thân nhân.
-- 23. Danh sách những nhân viên (HONV, TENLOT, TENNV) không có thân nhân nào.
-- 24. Danh sách những trưởng phòng (HONV, TENLOT, TENNV) có tối thiểu một thân nhân.
-- 25. Tìm họ (HONV) của những trưởng phòng chưa có gia đình.
-- 26. Danh sách những nhân viên (HONV, TENLOT, TENNV) làm việc trong mọi đề án của công ty
-- 27. Danh sách những nhân viên (HONV, TENLOT, TENNV) được phân công tất cả đề án do phòng số 4 chủ trì.
-- 28. Tìm những nhân viên (HONV, TENLOT, TENNV) được phân công tất cả đề án mà nhân viên Đinh Bá Tiến làm việc