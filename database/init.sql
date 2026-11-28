-- ==========================================
-- 1. TẠO DATABASE
-- ==========================================
IF DB_ID('TKQ_Cafe') IS NULL
    CREATE DATABASE TKQ_Cafe;
GO

USE TKQ_Cafe;
GO

SET QUOTED_IDENTIFIER ON;
GO

-- ==========================================
-- 2. TẠO CÁC BẢNG (TABLES)
-- ==========================================

-- Bảng Tài khoản (Đăng nhập, phân quyền, hỗ trợ Google Login)
CREATE TABLE Account (
    id        INT IDENTITY(1,1) PRIMARY KEY,
    username  VARCHAR(50)  UNIQUE NOT NULL,
    password  VARCHAR(255) NULL,       -- Cho phép NULL với tài khoản đăng nhập Google
    email     VARCHAR(100) NULL,
    google_id VARCHAR(100) NULL,
    role      VARCHAR(20)  NOT NULL,   -- ADMIN, STAFF
    CONSTRAINT CK_Account_Role CHECK (role IN ('ADMIN', 'STAFF'))
);

CREATE UNIQUE INDEX UX_Account_Email ON Account(email) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX UX_Account_GoogleId ON Account(google_id) WHERE google_id IS NOT NULL;

-- Bảng Nhân viên (Liên kết 1-1 với Account)
CREATE TABLE Employee (
    id            INT IDENTITY(1,1) PRIMARY KEY,
    full_name     NVARCHAR(100) NOT NULL,
    phone_number  VARCHAR(20)   NULL,
    identity_card VARCHAR(20)   NULL,
    date_of_birth DATE          NULL,
    position      NVARCHAR(50)  NULL,
    hire_date     DATE          NULL,
    salary        DECIMAL(18,2) NULL,
    account_id    INT           NULL UNIQUE,
    is_active     BIT           DEFAULT 1,
    CONSTRAINT FK_Employee_Account FOREIGN KEY (account_id) REFERENCES Account(id)
);

-- Bảng Danh mục sản phẩm (Cà phê, Trà, Nước ép...)
CREATE TABLE Category (
    id          INT IDENTITY(1,1) PRIMARY KEY,
    name        NVARCHAR(100) NOT NULL,
    description NVARCHAR(255) NULL
);

-- Bảng Sản phẩm (Menu đồ uống)
CREATE TABLE Product (
    id           INT IDENTITY(1,1) PRIMARY KEY,
    name         NVARCHAR(100) NOT NULL,
    price        DECIMAL(18,2) NOT NULL,
    image_url    VARCHAR(255)  NULL,
    category_id  INT           NULL,
    is_available BIT           DEFAULT 1, -- 1: Còn hàng, 0: Hết hàng
    CONSTRAINT FK_Product_Category FOREIGN KEY (category_id) REFERENCES Category(id)
);

-- Bảng Sơ đồ bàn (Bàn 1, Bàn 2...)
CREATE TABLE CafeTable (
    id     INT IDENTITY(1,1) PRIMARY KEY,
    name   NVARCHAR(50) NOT NULL,
    status VARCHAR(20)  DEFAULT 'AVAILABLE', -- AVAILABLE (Trống), OCCUPIED (Có khách)
    CONSTRAINT CK_CafeTable_Status CHECK (status IN ('AVAILABLE', 'OCCUPIED'))
);

-- Bảng Hóa đơn (Lưu trữ thông tin tổng quát của một lần gọi món)
CREATE TABLE Orders (
    id             INT IDENTITY(1,1) PRIMARY KEY,
    table_id       INT           NULL,       -- NULL nếu là đơn mang đi (TAKEAWAY)
    account_id     INT           NOT NULL,
    total_amount   DECIMAL(18,2) DEFAULT 0,
    status         VARCHAR(20)   NOT NULL DEFAULT 'PENDING',  -- PENDING, PAID, CANCELLED
    order_type     VARCHAR(20)   NOT NULL DEFAULT 'DINE_IN',  -- DINE_IN, TAKEAWAY
    payment_method VARCHAR(20)   NULL,
    created_at     DATETIME      DEFAULT GETDATE(),
    CONSTRAINT FK_Orders_CafeTable FOREIGN KEY (table_id) REFERENCES CafeTable(id),
    CONSTRAINT FK_Orders_Account   FOREIGN KEY (account_id) REFERENCES Account(id),
    CONSTRAINT CK_Orders_Status    CHECK (status IN ('PENDING', 'PAID', 'CANCELLED')),
    CONSTRAINT CK_Orders_OrderType CHECK (order_type IN ('DINE_IN', 'TAKEAWAY'))
);

-- Bảng Chi tiết hóa đơn (Lưu trữ từng món trong hóa đơn)
CREATE TABLE OrderDetail (
    id         INT IDENTITY(1,1) PRIMARY KEY,
    order_id   INT           NULL,
    product_id INT           NULL,
    quantity   INT           NOT NULL CHECK (quantity > 0),
    price      DECIMAL(18,2) NOT NULL, -- Lưu lại giá tại thời điểm khách gọi món
    note       NVARCHAR(255) NULL,
    CONSTRAINT FK_OrderDetail_Orders  FOREIGN KEY (order_id) REFERENCES Orders(id),
    CONSTRAINT FK_OrderDetail_Product FOREIGN KEY (product_id) REFERENCES Product(id)
);

-- Bảng Thanh toán (Quản lý giao dịch thanh toán theo từng đơn hàng)
CREATE TABLE Payment (
    id             INT IDENTITY(1,1) PRIMARY KEY,
    order_id       INT           NOT NULL UNIQUE,
    amount         DECIMAL(18,2) NOT NULL,
    payment_method VARCHAR(20)   NOT NULL,
    payment_status VARCHAR(20)   NOT NULL DEFAULT 'PENDING',
    paid_at        DATETIME      NULL,
    CONSTRAINT FK_Payment_Orders FOREIGN KEY (order_id) REFERENCES Orders(id),
    CONSTRAINT CK_Payment_Amount CHECK (amount >= 0),
    CONSTRAINT CK_Payment_Method CHECK (payment_method IN ('CASH', 'BANKING')),
    CONSTRAINT CK_Payment_Status CHECK (payment_status IN ('PENDING', 'SUCCESS', 'FAILED'))
);
GO

-- ==========================================
-- 3. INDEX TỐI ƯU TRUY VẤN
-- ==========================================
CREATE INDEX IX_Orders_Status       ON Orders(status);
CREATE INDEX IX_Orders_CreatedAt    ON Orders(created_at);
CREATE INDEX IX_Orders_AccountId    ON Orders(account_id);
CREATE INDEX IX_OrderDetail_OrderId ON OrderDetail(order_id);
CREATE INDEX IX_Product_CategoryId  ON Product(category_id);
GO

-- ==========================================
-- 4. THÊM DỮ LIỆU MẪU (DUMMY DATA)
-- ==========================================

-- Tài khoản Admin mặc định (mật khẩu 'admin123' đã mã hóa BCrypt; hãy đổi sau khi triển khai)
INSERT INTO Account (username, password, role)
VALUES ('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'ADMIN');

-- Danh mục
INSERT INTO Category (name, description) VALUES
(N'Cà phê pha máy', N'Các loại cà phê Espresso, Latte, Cappuccino'),
(N'Trà trái cây',   N'Trà thanh nhiệt, tươi mát'),
(N'Bánh ngọt',      N'Bánh dùng kèm trà và cà phê');

-- Bàn
INSERT INTO CafeTable (name, status) VALUES
(N'Bàn 1',   'AVAILABLE'),
(N'Bàn 2',   'AVAILABLE'),
(N'Bàn 3',   'AVAILABLE'),
(N'Bàn 4',   'AVAILABLE'),
(N'Bàn VIP', 'AVAILABLE');

-- Sản phẩm
INSERT INTO Product (name, price, image_url, category_id, is_available) VALUES
(N'Cà phê Đen Đá',    25000, 'cafe-den.jpg', 1, 1),
(N'Bạc Xỉu',          30000, 'bac-xiu.jpg',  1, 1),
(N'Trà Đào Cam Sả',   45000, 'tra-dao.png',  2, 1),
(N'Trà Vải Nhiệt Đới',45000, 'tra-vai.jpg',  2, 1),
(N'Bánh Croissant',   35000, 'croissant.jpg',3, 1),
(N'Tiramisu',         40000, 'tiramisu.jpg', 3, 1);
GO

-- ==========================================
-- 5. VIEW & STORED PROCEDURE
-- ==========================================

-- View: Thống kê tổng doanh thu và số đơn hàng theo từng ngày
CREATE VIEW vw_DailyRevenue AS
SELECT
    CAST(created_at AS DATE) AS OrderDate,
    COUNT(id)                AS TotalOrders,
    SUM(total_amount)        AS DailyRevenue
FROM Orders
WHERE status = 'PAID'
GROUP BY CAST(created_at AS DATE);
GO

-- SP: Chốt ca / Thanh toán một hóa đơn
CREATE PROCEDURE sp_CheckoutOrder
    @OrderId INT
AS
BEGIN
    DECLARE @Total DECIMAL(18,2);
    SELECT @Total = ISNULL(SUM(quantity * price), 0)
    FROM OrderDetail
    WHERE order_id = @OrderId;

    UPDATE Orders
    SET total_amount = @Total,
        status       = 'PAID'
    WHERE id = @OrderId;
END;
GO
