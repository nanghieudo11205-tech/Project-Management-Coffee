# Hướng Dẫn Vẽ và Khai Thác Biểu Đồ UML & DFD Hệ Thống Quản Lý Quán Cà Phê

Tài liệu này cung cấp hướng dẫn toàn diện về cách vẽ, chỉnh sửa và xuất các biểu đồ UML và DFD của hệ thống **Quản Lý Quán Cà Phê (Coffee Chill)** phục vụ báo cáo bài tập lớn Phân tích Thiết kế Hệ thống Thông tin (PTTKHTTT).

---

## 1. Công Cụ Khuyên Dùng

- **Phần mềm trực tuyến:** [Draw.io / diagrams.net](https://app.diagrams.net/) (Miễn phí, không cần cài đặt, không cần đăng nhập).
- **Phần mềm máy tính (Offline):** Draw.io Desktop (tải từ trang chủ drawio-app).

---

## 2. Hướng Dẫn Kéo Thả và Mở File Trong Thư Mục `docs/diagrams/`

Toàn bộ sơ đồ đã được mã hóa chuẩn thành các file `.drawio` độc lập đặt tại:
`d:\PTTKHTTT\docs\diagrams\`

### Các bước mở sơ đồ:
1. Truy cập **[https://app.diagrams.net/](https://app.diagrams.net/)**.
2. Khi hộp thoại chào mừng xuất hiện, chọn **Open Existing Diagram** (hoặc chọn menu **File** -> **Open From** -> **Device...**).
3. Hoặc đơn giản nhất: **Kéo thả chuột (Drag & Drop)** trực tiếp file `.drawio` vào cửa sổ trình duyệt.

> [!WARNING]
> Không dán mã XML vào mục **Arrange -> Insert -> Advanced -> Mermaid** vì Draw.io sẽ thông báo lỗi: `Unsupported diagram type: <mxfile`. Draw.io mở trực tiếp file `.drawio` bằng kéo thả hoặc menu File -> Open.

---

## 3. Danh Mục Các Biểu Đồ Trong Hệ Thống

### 3.1. Sơ đồ Thực thể Liên kết (ERD) - Cơ sở dữ liệu
- **File:** `docs/diagrams/01_tat_ca_cac_bang_csdl.drawio`
- **Mục đích:** Đặc tả cấu trúc 7 bảng trong CSDL SQL Server: `Account`, `Employee`, `CafeTable`, `Category`, `Product`, `Orders`, `OrderDetail`.
- **Quan hệ chính:**
  - `Category` 1 - n `Product` (Khóa ngoại `category_id`)
  - `CafeTable` 1 - n `Orders` (Khóa ngoại `table_id`)
  - `Employee` 1 - n `Orders` (Khóa ngoại `employee_id`)
  - `Orders` 1 - n `OrderDetail` (Khóa ngoại `order_id`)
  - `Product` 1 - n `OrderDetail` (Khóa ngoại `product_id`)
  - `Employee` 1 - 1 `Account` (Khóa ngoại `employee_id`)

### 3.2. Sơ đồ Use Case Toàn Hệ Thống
- **File:** `docs/diagrams/02_usecase_toan_he_thong.drawio`
- **Actor:** Ban Quản Trị (Admin), Nhân Viên (Thu ngân / Phục vụ), Hệ Thống.
- **Use Case:** Đăng nhập, Bán hàng POS, Quản lý bàn, Quản lý thực đơn, Quản lý nhân sự, Thống kê doanh thu báo cáo.

### 3.3. Sơ đồ Kiến trúc Thành phần (Component Diagram)
- **File:** `docs/diagrams/03_kien_truc_thanh_phan.drawio`
- **Tầng:**
  - UI Component: POS UI, Admin Dashboard.
  - Controller / Service Component: OrderService, ProductService, TableService, ReportService.
  - Repository / Database Component: Spring Data JPA + SQL Server Engine.

### 3.4. Sơ đồ Triển khai (Deployment Diagram)
- **File:** `docs/diagrams/04_so_do_trien_khai.drawio`
- **Nút vật lý:** Thiết bị máy trạm POS / Mobile Browser kết nối qua HTTPS/WSS tới Application Server chạy máy ảo Java JVM, kết nối qua cổng TCP 1433 tới Database Server Microsoft SQL Server.

### 3.5. Chuỗi Sơ đồ DFD Mức 2 (Mức Dưới Đỉnh)
- `05_dfd_thong_ke_bao_cao.drawio`: Phân hệ Thống kê & Báo cáo (Chuẩn ký hiệu 2 vạch song song cho Kho dữ liệu theo đúng bản vẽ tay).
- `06_dfd_ban_hang_pos.drawio`: Phân hệ Bán hàng & Order tại bàn.
- `07_dfd_quan_ly_ban.drawio`: Phân hệ Quản lý & Điều phối bàn cà phê.
- `08_dfd_thuc_don_mon.drawio`: Phân hệ Quản lý Món & Giá bán.
- `09_dfd_quan_ly_nhan_su.drawio`: Phân hệ Quản lý Nhân viên & Ca làm.
- `10_dfd_xac_thuc_dang_nhap.drawio`: Phân hệ Kiểm tra Thông tin & Đăng nhập.

### 3.6. Các Sơ đồ Trình tự (Sequence Diagram)
- `11_sequence_tao_don_hang.drawio`: Luồng gọi món tại quầy từ Thu ngân -> Giao diện POS -> Backend Service -> SQL Server.
- `12_sequence_thanh_toan_hoa_don.drawio`: Luồng thanh toán tiền mặt/chuyển khoản, in hóa đơn và giải phóng bàn cà phê về trạng thái trống.

---

## 4. Cách Xuất Ảnh Đưa Vào Báo Cáo Word / PDF

1. Trong Draw.io, chọn menu **File** -> **Export as** -> **PNG...** (hoặc **JPEG...**, **PDF...**).
2. Tùy chọn xuất:
   - **Zoom:** 200% hoặc 300% (để ảnh chèn vào Word sắc nét, không bị mờ nhòe chữ).
   - **Border Width:** 10 (để ảnh có khoảng trống viền đẹp mắt).
   - **Transparent Background:** Bỏ chọn nếu muốn nền trắng chuẩn in ấn văn bản.
3. Nhấn **Export** và lưu file ảnh về máy tính, sau đó chèn vào tài liệu Word Báo cáo BTL.
