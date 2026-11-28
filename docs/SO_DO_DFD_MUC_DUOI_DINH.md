# Đặc Tả Các Sơ Đồ Luồng Dữ Liệu (DFD) Mức Dưới Đỉnh (Mức 2)

Tài liệu này tổng hợp cấu trúc, tiến trình (Process), luồng dữ liệu (Data Flow) và kho dữ liệu (Data Store) cho toàn bộ các phân hệ chức năng của Hệ thống Quản Lý Quán Cà Phê.

Quy ước ký hiệu theo chuẩn Gane & Sarson / DeMarco:
- **Tiến trình (Process):** Hình tròn hoặc elip, mang số hiệu phân cấp (ví dụ: `1.1`, `5.1`).
- **Tác nhân ngoài (External Entity):** Hình chữ nhật (ví dụ: `Ban quản trị`, `Khách hàng`, `Nhân viên thu ngân`).
- **Kho dữ liệu (Data Store):** Hình 2 đường thẳng song song (kèm tên kho ở giữa, ví dụ: `Hóa đơn Doanh thu`, `Danh sách phòng / bàn`, `Danh sách dịch vụ / món`).
- **Luồng dữ liệu (Data Flow):** Mũi tên có gắn nhãn mô tả thông tin luân chuyển.

---

## 1. Phân Hệ Thống Kê & Báo Cáo (DFD 5.0)
- **File sơ đồ:** `docs/diagrams/05_dfd_thong_ke_bao_cao.drawio`
- **Tiến trình con:**
  - `5.1. Thống kê kinh doanh`: Nhận yêu cầu thống kê từ Ban quản trị, truy vấn từ các kho `Hóa đơn Doanh thu`, `Danh sách phòng / bàn`, `Danh sách dịch vụ / món`, `Hồ sơ nhân viên`. Trả về kết quả thống kê doanh thu, tỷ trọng món, hiệu suất ca. Đồng thời chuyển tiếp `Dữ liệu thống kê tổng hợp` sang tiến trình 5.2.
  - `5.2. Báo cáo định kỳ`: Tiếp nhận yêu cầu báo cáo định kỳ theo tuần/tháng/quý từ Ban quản trị, kết hợp với dữ liệu tổng hợp để xuất báo cáo định kỳ lưu trữ vào kho `Báo cáo thống kê` và gửi kết quả báo cáo về Ban quản trị.

---

## 2. Phân Hệ Bán Hàng & Gọi Món POS (DFD 1.0)
- **File sơ đồ:** `docs/diagrams/06_dfd_ban_hang_pos.drawio`
- **Tiến trình con:**
  - `1.1. Tiếp nhận gọi món`: Thu ngân/phục vụ chọn bàn và món, kiểm tra trạng thái bàn và giá món từ kho `Danh sách bàn` và `Danh mục thực đơn`.
  - `1.2. Xử lý & Lưu đơn hàng`: Ghi nhận đơn hàng vào kho `Đơn hàng (Orders)` và chi tiết từng món vào kho `Chi tiết đơn hàng (OrderDetail)`, đồng thời cập nhật trạng thái bàn sang "Có khách".
  - `1.3. Thanh toán & In hóa đơn`: Thu ngân xác nhận thu tiền, ghi nhận thời gian kết thúc, lưu thông tin hóa đơn vào kho `Hóa đơn doanh thu` và in hóa đơn cho khách hàng.

---

## 3. Phân Hệ Quản Lý Bàn Phục Vụ (DFD 2.0)
- **File sơ đồ:** `docs/diagrams/07_dfd_quan_ly_ban.drawio`
- **Tiến trình con:**
  - `2.1. Quản lý danh mục bàn`: Ban quản trị thêm/sửa thông tin bàn, sức chứa, số hiệu bàn.
  - `2.2. Điều phối & Chuyển/Ghép bàn`: Nhân viên thực hiện thao tác chuyển khách từ bàn A sang bàn B hoặc ghép nhiều bàn cùng đoàn khách.
  - `2.3. Cập nhật trạng thái bàn`: Hệ thống tự động đồng bộ trạng thái bàn (0: Trống, 1: Có khách) theo diễn biến phục vụ.

---

## 4. Phân Hệ Quản Lý Thực Đơn & Đơn Giá (DFD 3.0)
- **File sơ đồ:** `docs/diagrams/08_dfd_thuc_don_mon.drawio`
- **Tiến trình con:**
  - `3.1. Quản lý phân loại danh mục`: Quản lý danh mục nhóm đồ uống (Cà phê, Trà hoa quả, Đá xay, Bánh ngọt,...).
  - `3.2. Quản lý món & Giá bán`: Thêm sản phẩm mới, cập nhật hình ảnh, mô tả, định lượng và giá niêm yết vào kho `Danh mục món (Product)`.

---

## 5. Phân Hệ Quản Lý Nhân Sự (DFD 4.0)
- **File sơ đồ:** `docs/diagrams/09_dfd_quan_ly_nhan_su.drawio`
- **Tiến trình con:**
  - `4.1. Tiếp nhận & Hồ sơ nhân sự`: Cập nhật thông tin nhân viên, chức vụ, mức lương cơ bản vào kho `Hồ sơ nhân viên (Employee)`.
  - `4.2. Quản lý tài khoản & Phân quyền`: Khởi tạo tài khoản đăng nhập cho nhân viên mới vào kho `Tài khoản (Account)`, gán quyền Admin hoặc Staff.
  - `4.3. Theo dõi ca trực & Lịch`: Phân chia ca làm việc và ghi nhận thời gian làm.

---

## 6. Phân Hệ Xác Thực & Phân Quyền (DFD 0.0)
- **File sơ đồ:** `docs/diagrams/10_dfd_xac_thuc_dang_nhap.drawio`
- **Tiến trình con:**
  - `0.1. Kiểm tra & Xác thực đăng nhập`: Tiếp nhận tên đăng nhập và mật khẩu, kiểm tra mã băm bảo mật trong kho `Account`.
  - `0.2. Cấp quyền & Phiên làm việc`: Xác định Role (Quản trị viên hoặc Nhân viên), cấp Token/Session làm việc tương ứng và điều hướng giao diện phù hợp.
