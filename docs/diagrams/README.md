# Danh Mục Các Sơ Đồ Thiết Kế Hệ Thống Quản Lý Quán Cà Phê (Draw.io)

Thư mục này chứa đầy đủ các file sơ đồ thiết kế cho hệ thống **Quản Lý Quán Cà Phê (Coffee Chill)**, sẵn sàng để mở hoặc kéo thả vào [Draw.io (diagrams.net)](https://app.diagrams.net/).

---

## 1. Hướng Dẫn Mở File Trên Draw.io

### Cách 1: Kéo Thả Trực Tiếp (Khuyên dùng - Nhanh nhất)
1. Mở trình duyệt và truy cập: **[https://app.diagrams.net/](https://app.diagrams.net/)**
2. Nắm chuột vào file `.drawio` từ thư mục trên máy tính của bạn và **kéo thả trực tiếp** vào giữa màn hình Draw.io.
3. Sơ đồ sẽ được nạp và hiển thị ngay lập tức với đầy đủ khối, đường nối, màu sắc.

### Cách 2: Menu Mở File
1. Trên giao diện Draw.io: Chọn **File** -> **Open From** -> **Device...**
2. Chọn file `.drawio` tương ứng trong thư mục `docs/diagrams/`.

*(Lưu ý: Không dùng menu `Arrange -> Insert -> Advanced -> Mermaid` vì đó là trình biên dịch mã Mermaid, sẽ báo lỗi "Unsupported diagram type: <mxfile" khi dán XML Drawio).*

---

## 2. Danh Sách Các File Sơ Đồ

| STT | Tên File | Loại Sơ Đồ | Mô Tả Chi Tiết |
| :---: | :--- | :--- | :--- |
| **01** | `01_tat_ca_cac_bang_csdl.drawio` | **ERD CSDL** | Toàn bộ 7 bảng cơ sở dữ liệu (`Account`, `CafeTable`, `Category`, `Product`, `Orders`, `OrderDetail`, `Employee`), đầy đủ khóa chính (PK), khóa ngoại (FK), kiểu dữ liệu và liên kết 1-n, 1-1. |
| **02** | `02_usecase_toan_he_thong.drawio` | **Use Case** | Sơ đồ Use Case tổng quan phân quyền cho 3 Actor chính: Quản lý (Admin), Nhân viên (Thu ngân/Pha chế), và Hệ thống. |
| **03** | `03_kien_truc_thanh_phan.drawio` | **Component** | Sơ đồ kiến trúc 3 tầng: Tầng Trình diễn (React/HTML5 Client), Tầng Nghiệp vụ (Spring Boot REST API), Tầng Dữ liệu (Spring Data JPA + SQL Server). |
| **04** | `04_so_do_trien_khai.drawio` | **Deployment** | Sơ đồ triển khai phần cứng: Client Tier (POS PC, Mobile), Application Server (Java Virtual Machine, Spring Boot), Database Server (SQL Server 2022). |
| **05** | `05_dfd_thong_ke_bao_cao.drawio` | **DFD Mức 2** | Phân hệ **Thống kê & Báo cáo** (chuẩn theo mẫu vẽ tay với 2 đường thẳng song song cho kho dữ liệu): Thống kê doanh thu, phòng/bàn, dịch vụ món, nhân viên. |
| **06** | `06_dfd_ban_hang_pos.drawio` | **DFD Mức 2** | Phân hệ **Bán hàng & Gọi món (POS)**: Tiếp nhận gọi món, cập nhật bàn, in hóa đơn & thanh toán. |
| **07** | `07_dfd_quan_ly_ban.drawio` | **DFD Mức 2** | Phân hệ **Quản lý Bàn phục vụ**: Thêm/sửa danh mục bàn, chuyển/ghép bàn, cập nhật trạng thái bàn. |
| **08** | `08_dfd_thuc_don_mon.drawio` | **DFD Mức 2** | Phân hệ **Quản lý Thực đơn & Đơn giá**: Quản lý nhóm món, sản phẩm, điều chỉnh giá và công thức. |
| **09** | `09_dfd_quan_ly_nhan_su.drawio` | **DFD Mức 2** | Phân hệ **Quản lý Nhân sự & Phân ca**: Quản lý hồ sơ nhân viên, cấp tài khoản, phân ca làm việc. |
| **10** | `10_dfd_xac_thuc_dang_nhap.drawio` | **DFD Mức 2** | Phân hệ **Xác thực & Đăng nhập**: Kiểm tra thông tin đăng nhập, băm mật khẩu, phân quyền JWT/Session. |
| **11** | `11_sequence_tao_don_hang.drawio` | **Sequence** | Sơ đồ trình tự quá trình **Tạo đơn hàng POS** (Luồng tương tác giữa Thu ngân -> POS UI -> Backend Service -> SQL Server). |
| **12** | `12_sequence_thanh_toan_hoa_don.drawio` | **Sequence** | Sơ đồ trình tự quá trình **Thanh toán & Trả bàn** (Thu ngân -> POS UI -> Payment Service -> Cập nhật Orders & Giải phóng CafeTable). |

---

## 3. File Tổng Hợp Nhiều Trang (All-In-One)

Bên cạnh các file riêng lẻ trên, bạn có thể mở file tổng hợp chứa toàn bộ sơ đồ phân chia theo từng Tab (Page):
- Đường dẫn: `docs/tat_ca_cac_bang_va_so_do.drawio`
