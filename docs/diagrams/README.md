# Thư Mục Các File Sơ Đồ Vẽ Bằng Draw.io (Web QLCafe)

Thư mục này chứa từng file sơ đồ riêng biệt đã được định dạng chuẩn 100% cho **Draw.io (diagrams.net)**.

## 🚀 Cách mở sơ đồ trên Draw.io (Chỉ mất 2 giây):
1. Mở trang [Draw.io](https://app.diagrams.net/) trên trình duyệt.
2. Mở thư mục này trên máy tính (`D:\PTTKHTTT\docs\diagrams\`).
3. Dùng chuột **kéo file `.drawio` tương ứng và thả thẳng vào giữa màn hình Draw.io**!

---

## 📑 Danh Sách Từng File Sơ Đồ:

### 1. Nhóm Bảng CSDL & Toàn Hệ Thống:
* [01_tat_ca_cac_bang_csdl.drawio](file:///d:/PTTKHTTT/docs/diagrams/01_tat_ca_cac_bang_csdl.drawio): **Sơ đồ cấu trúc tất cả 7 bảng CSDL (ERD)** có đầy đủ khóa chính (PK), khóa ngoại (FK), kiểu dữ liệu và đường nối quan hệ 1-1, 1-N.
* [02_usecase_toan_he_thong.drawio](file:///d:/PTTKHTTT/docs/diagrams/02_usecase_toan_he_thong.drawio): **Sơ đồ Use Case toàn hệ thống** (Khách hàng, Thu ngân, Quản lý, Google OAuth, Gemini AI).
* [03_kien_truc_thanh_phan.drawio](file:///d:/PTTKHTTT/docs/diagrams/03_kien_truc_thanh_phan.drawio): **Biểu đồ Kiến trúc thành phần (Component Diagram 3 tầng)**: Next.js Frontend $\leftrightarrow$ Spring Boot Backend $\leftrightarrow$ SQL Server Database.
* [04_so_do_trien_khai.drawio](file:///d:/PTTKHTTT/docs/diagrams/04_so_do_trien_khai.drawio): **Biểu đồ Triển khai (Deployment Diagram)**: Client Device, Web Server, App Server, DB Server, Google Cloud.

### 2. Nhóm Sơ Đồ Luồng Dữ Liệu (DFD) Mức Dưới Đỉnh:
*(Được thiết kế chuẩn mực với tiến trình hình tròn và kho dữ liệu **2 đường kẻ song song** y hệt hình mẫu)*
* [05_dfd_thong_ke_bao_cao.drawio](file:///d:/PTTKHTTT/docs/diagrams/05_dfd_thong_ke_bao_cao.drawio): DFD Phân hệ Thống kê kinh doanh và Báo cáo định kỳ (Khớp 100% ảnh mẫu).
* [06_dfd_ban_hang_pos.drawio](file:///d:/PTTKHTTT/docs/diagrams/06_dfd_ban_hang_pos.drawio): DFD Phân hệ Bán hàng tại quầy POS & Xử lý đơn hàng.
* [07_dfd_quan_ly_ban.drawio](file:///d:/PTTKHTTT/docs/diagrams/07_dfd_quan_ly_ban.drawio): DFD Phân hệ Quản lý Sơ đồ bàn (Thêm, sửa tên, xóa mềm, đổi trạng thái).
* [08_dfd_thuc_don_mon.drawio](file:///d:/PTTKHTTT/docs/diagrams/08_dfd_thuc_don_mon.drawio): DFD Phân hệ Thực đơn và Sản phẩm (Danh mục, cập nhật món, lưu trữ ảnh).
* [09_dfd_quan_ly_nhan_su.drawio](file:///d:/PTTKHTTT/docs/diagrams/09_dfd_quan_ly_nhan_su.drawio): DFD Phân hệ Quản lý Nhân sự & Tài khoản.
* [10_dfd_xac_thuc_dang_nhap.drawio](file:///d:/PTTKHTTT/docs/diagrams/10_dfd_xac_thuc_dang_nhap.drawio): DFD Phân hệ Xác thực & Đăng nhập (BCrypt, JWT Token, Google OAuth2).

### 3. Nhóm Sơ Đồ Tuần Tự Nghiệp Vụ Cốt Lõi (Sequence Diagram):
* [11_sequence_tao_don_hang.drawio](file:///d:/PTTKHTTT/docs/diagrams/11_sequence_tao_don_hang.drawio): Luồng gọi món tại bàn, lưu đơn PENDING và đổi bàn sang OCCUPIED.
* [12_sequence_thanh_toan_hoa_don.drawio](file:///d:/PTTKHTTT/docs/diagrams/12_sequence_thanh_toan_hoa_don.drawio): Luồng thanh toán đơn hàng (PAID) và giải phóng bàn về AVAILABLE.
