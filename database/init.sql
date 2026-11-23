-- ==========================================
-- 1. TẠO DATABASE
-- ==========================================
CREATE DATABASE TKQ_Cafe;
GO

USE TKQ_Cafe;
GO

-- ==========================================
-- 2. TẠO CÁC BẢNG (TABLES)
-- ==========================================

-- Bảng Tài khoản (Đăng nhập, phân quyền)
CREATE TABLE Account (
    id INT IDENTITY(1,1) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL -- Ví dụ: ADMIN, STAFF
);

-- Bảng Danh mục sản phẩm (Cà phê, Trà, Nước ép...)
CREATE TABLE Category (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,
    description NVARCHAR(255)
);

-- Bảng Sản phẩm (Menu đồ uống)
CREATE TABLE Product (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,
    price DECIMAL(18,2) NOT NULL,
    image_url VARCHAR(255),
    category_id INT,
    is_available BIT DEFAULT 1, -- 1: Còn hàng, 0: Hết hàng
    FOREIGN KEY (category_id) REFERENCES Category(id)
);

-- Bảng Sơ đồ bàn (Bàn 1, Bàn 2...)
CREATE TABLE CafeTable (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'AVAILABLE' -- AVAILABLE (Trống), OCCUPIED (Có khách)
);

-- Bảng Hóa đơn (Lưu trữ thông tin tổng quát của một lần gọi món)
CREATE TABLE Orders (
    id INT IDENTITY(1,1) PRIMARY KEY,
    table_id INT NULL, -- NULL đối với đơn mang đi (Takeaway)
    account_id INT,
    total_amount DECIMAL(18,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING (Đang phục vụ), PAID (Đã thanh toán), CANCELLED (Hủy)
    order_type VARCHAR(20) DEFAULT 'DINE_IN', -- DINE_IN (Tại bàn), TAKEAWAY (Mang về)
    payment_method VARCHAR(20) DEFAULT 'CASH', -- CASH (Tiền mặt), BANKING (Chuyển khoản)
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (table_id) REFERENCES CafeTable(id),
    FOREIGN KEY (account_id) REFERENCES Account(id)
);

-- Bảng Chi tiết hóa đơn (Lưu trữ từng món trong hóa đơn)
CREATE TABLE OrderDetail (
    id INT IDENTITY(1,1) PRIMARY KEY,
    order_id INT,
    product_id INT,
    quantity INT NOT NULL CHECK (quantity > 0),
    price DECIMAL(18,2) NOT NULL, -- Lưu lại giá tại thời điểm mua (tránh trường hợp sau này sản phẩm tăng giá làm sai doanh thu cũ)
    note NVARCHAR(255), -- Ghi chú món: ít đá, ít đường, v.v.
    FOREIGN KEY (order_id) REFERENCES Orders(id),
    FOREIGN KEY (product_id) REFERENCES Product(id)
);

-- Bảng Nhân viên (Lưu thông tin chi tiết nhân sự, liên kết với tài khoản)
CREATE TABLE Employee (
    id INT IDENTITY(1,1) PRIMARY KEY,
    full_name NVARCHAR(100) NOT NULL,
    phone_number VARCHAR(20),
    identity_card VARCHAR(20),
    date_of_birth DATE,
    position NVARCHAR(50), -- Quản lý, Pha chế, Thu ngân, Phục vụ...
    hire_date DATE DEFAULT CAST(GETDATE() AS DATE),
    salary DECIMAL(18,2) DEFAULT 0,
    account_id INT UNIQUE,
    is_active BIT DEFAULT 1,
    FOREIGN KEY (account_id) REFERENCES Account(id)
);
GO

-- ==========================================
-- 3. THÊM DỮ LIỆU MẪU (DUMMY DATA)
-- ==========================================

-- Insert default admin account (Password is 'admin' hashed with BCrypt)
INSERT INTO Account (username, password, role) VALUES ('admin', 'Admin109205@', 'ADMIN');

-- Thêm Danh mục
INSERT INTO Category (name, description) VALUES 
(N'Cà phê pha máy', N'Các loại cà phê Espresso, Latte, Cappuccino'),
(N'Trà trái cây', N'Trà thanh nhiệt, tươi mát'),
(N'Bánh ngọt', N'Bánh dùng kèm trà và cà phê');

-- Thêm Bàn
INSERT INTO CafeTable (name, status) VALUES 
(N'Bàn 1', 'AVAILABLE'),
(N'Bàn 2', 'AVAILABLE'),
(N'Bàn 3', 'AVAILABLE'),
(N'Bàn 4', 'AVAILABLE'),
(N'Bàn VIP', 'AVAILABLE');

-- Thêm Sản phẩm
INSERT INTO Product (name, price, image_url, category_id, is_available) VALUES
(N'Cà phê Đen Đá', 25000, 'cafe-den.jpg', 1, 1),
(N'Bạc Xỉu', 30000, 'bac-xiu.jpg', 1, 1),
(N'Trà Đào Cam Sả', 45000, 'tra-dao.png', 2, 1),
(N'Trà Vải Nhiệt Đới', 45000, 'tra-vai.jpg', 2, 1),
(N'Bánh Croissant', 35000, 'croissant.jpg', 3, 1),
(N'Tiramisu', 40000, 'tiramisu.jpg', 3, 1);

-- Thêm Nhân viên mặc định (liên kết với Account id = 1)
INSERT INTO Employee (full_name, phone_number, identity_card, date_of_birth, position, hire_date, salary, account_id, is_active) VALUES
(N'Nguyễn Văn Quản Lý', '0901234567', '001200001234', '1995-05-15', N'Quản lý', '2024-01-01', 12000000, 1, 1);
GO

-- View: Thống kê tổng doanh thu và số đơn hàng theo từng ngày
CREATE VIEW vw_DailyRevenue AS
SELECT 
    CAST(created_at AS DATE) AS OrderDate,
    COUNT(id) AS TotalOrders,
    SUM(total_amount) AS DailyRevenue
FROM 
    Orders
WHERE 
    status = 'PAID' -- Chỉ tính các đơn đã thanh toán
GROUP BY 
    CAST(created_at AS DATE);
GO

-- SP: Chốt ca / Thanh toán một hóa đơn
CREATE PROCEDURE sp_CheckoutOrder
    @OrderId INT
AS
BEGIN
    -- Tính tổng tiền từ chi tiết hóa đơn
    DECLARE @Total DECIMAL(18,2);
    SELECT @Total = ISNULL(SUM(quantity * price), 0)
    FROM OrderDetail
    WHERE order_id = @OrderId;

    -- Cập nhật vào hóa đơn chính và đổi trạng thái
    UPDATE Orders
    SET 
        total_amount = @Total,
        status = 'PAID'
    WHERE 
        id = @OrderId;
END;
GO

-- 1. Bảng Khách hàng thành viên
IF OBJECT_ID('dbo.khachhang', 'U') IS NULL
BEGIN
    CREATE TABLE khachhang (
        id INT IDENTITY(1,1) PRIMARY KEY,
        maKH VARCHAR(20) UNIQUE,
        hoTen NVARCHAR(255) NOT NULL,
        sdt VARCHAR(20) UNIQUE,
        email VARCHAR(255) UNIQUE,
        ngaySinh DATE,
        password VARCHAR(255)
    );
END;
GO

-- 2. Bảng Hóa đơn đặt hàng trực tuyến (Online)
IF OBJECT_ID('dbo.hoadonmuaonline', 'U') IS NULL
BEGIN
    CREATE TABLE hoadonmuaonline (
        id INT IDENTITY(1,1) PRIMARY KEY,
        maHD VARCHAR(20),
        ngayMua DATETIME DEFAULT GETDATE(),
        trangThai VARCHAR(50) DEFAULT 'COMPLETED',
        tongTien DECIMAL(18,2) DEFAULT 0,
        khachHangId INT,
        FOREIGN KEY (khachHangId) REFERENCES khachhang(id)
    );
END;
GO

-- 3. Tạo View hoadonbanhang ánh xạ sang bảng Orders của dự án
-- (Giúp các thủ tục truy vấn được cả các đơn hàng tại bàn của quán)
CREATE OR ALTER VIEW hoadonbanhang AS
SELECT 
    id,
    'HD' + CAST(id AS VARCHAR(10)) AS maHD,
    created_at AS ngayTao,
    total_amount AS tongTien,
    payment_method AS phuongThucTT,
    status AS trangThai,
    table_id AS banId,
    account_id AS nvThuNganId,
    1 AS khachHangId
FROM Orders;
GO

-- 4. Thêm một số dữ liệu mẫu để chạy thử thủ tục thống kê
IF NOT EXISTS (SELECT 1 FROM khachhang WHERE sdt = '0987654321')
BEGIN
    INSERT INTO khachhang (maKH, hoTen, sdt, email, ngaySinh, password) VALUES
    ('KH01', N'Trần Thị Mai', '0987654321', 'mai.tran@gmail.com', '2000-08-20', '123456'),
    ('KH02', N'Lê Hoàng Long', '0912345678', 'long.le@gmail.com', '1998-03-15', '123456');

    INSERT INTO hoadonmuaonline (maHD, ngayMua, trangThai, tongTien, khachHangId) VALUES
    ('HDO01', GETDATE(), 'COMPLETED', 125000, 1),
    ('HDO02', GETDATE(), 'COMPLETED', 85000, 2),
    ('HDO03', DATEADD(DAY, -3, GETDATE()), 'COMPLETED', 160000, 1);
END;
GO

-- ========================
-- 5. CÁC STORED PROCEDURES 
-- ========================

-- 5.1. Thủ tục Đăng ký khách hàng mới (DangKyKhachHang)
CREATE OR ALTER PROCEDURE DangKyKhachHang
    @p_HoTen NVARCHAR(255),
    @p_SDT VARCHAR(20),
    @p_Email VARCHAR(255),
    @p_NgaySinh DATE,
    @p_Password VARCHAR(255),
    @p_MaKH VARCHAR(10) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO khachhang (hoTen, sdt, email, ngaySinh, password)
    VALUES (@p_HoTen, @p_SDT, @p_Email, @p_NgaySinh, @p_Password);
    
    DECLARE @ID INT = SCOPE_IDENTITY();
    SET @p_MaKH = 'KH' + CAST(@ID AS VARCHAR(10));
    
    UPDATE khachhang SET maKH = @p_MaKH WHERE id = @ID;
    SELECT 1 AS Status, @p_MaKH AS MaKhachHang;
END;
GO

-- 5.2. Thủ tục Thống kê khách hàng theo doanh thu (TKKH)
CREATE OR ALTER PROCEDURE TKKH
    @nbd DATE,
    @nkt DATE
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        kh.id AS KhachHangID, 
        kh.maKH AS MaKhachHang, 
        kh.hoTen AS TenKhachHang,
        ISNULL(SUM(hd.tongTien), 0) + ISNULL(SUM(ht.tongTien), 0) AS TongDoanhThu
    FROM khachhang kh
    LEFT JOIN hoadonmuaonline hd 
        ON kh.id = hd.khachHangId AND CAST(hd.ngayMua AS DATE) BETWEEN @nbd AND @nkt
    LEFT JOIN hoadonbanhang ht 
        ON kh.id = ht.khachHangId AND ht.trangThai = 'PAID' AND CAST(ht.ngayTao AS DATE) BETWEEN @nbd AND @nkt
    GROUP BY kh.id, kh.maKH, kh.hoTen
    ORDER BY TongDoanhThu DESC;
END;
GO

-- 5.3. Thủ tục Lấy danh sách hóa đơn chi tiết của khách hàng
CREATE OR ALTER PROCEDURE GetListHDM
    @idKH INT,
    @nbd DATE,
    @nkt DATE
AS
BEGIN
    SET NOCOUNT ON;
    SELECT id AS MaHD, ngayMua AS NgayMua, trangThai AS TrangThai, tongTien AS TongTien, khachHangId AS IDKH
    FROM hoadonmuaonline
    WHERE khachHangId = @idKH AND CAST(ngayMua AS DATE) BETWEEN @nbd AND @nkt
    ORDER BY ngayMua ASC;
END;
GO

CREATE OR ALTER PROCEDURE GetListHDTT
    @idKH INT,
    @nbd DATETIME,
    @nkt DATETIME
AS
BEGIN
    SET NOCOUNT ON;
    SELECT id AS MaHD, ngayTao AS NgayMua, tongTien AS TongTien, nvThuNganId AS MaNVBH, khachHangId AS IDKH
    FROM hoadonbanhang
    WHERE khachHangId = @idKH AND trangThai = 'PAID' AND ngayTao BETWEEN @nbd AND @nkt
    ORDER BY ngayTao ASC;
END;
GO