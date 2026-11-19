# Phần I – Pha Đặc tả

## 1️⃣ Bảng từ khóa trong hệ thống quản lý quán cà phê

| **Con người** | **Hoạt động của con người** | **Vật / Đối tượng** |
|---|---|---|
| - Thành viên<br>- Khách hàng<br>- Nhân viên quản lý<br>- Nhân viên kho<br>- Nhân viên bán hàng<br>- Nhân viên giao hàng | - Đăng nhập / Đăng xuất<br>- Đăng ký thành viên<br>- Tìm kiếm, đặt hàng online<br>- Mua hàng tại quầy<br>- Quản lý xem thống kê (mặt hàng, nhà cung cấp, doanh thu)<br>- Nhân viên kho nhập, cập nhật, duyệt, xuất đơn<br>- Nhân viên bán hàng thực hiện bán hàng tại quầy | - Quán cà phê (hệ thống)
- **Sản phẩm / Mặt hàng**
- **Nhà cung cấp**
- **Hóa đơn** (nhập, bán, trực tiếp)
- **Kho**
- **Báo cáo**
- **Giao diện (UI)** |

---

## 2️⃣ Mô tả hệ thống bằng ngôn ngữ tự nhiên

### 🎯 Mục đích
Hệ thống giúp **quản lý toàn bộ hoạt động** của một quán cà phê: quản lý sản phẩm, nhân viên, khách hàng, đơn hàng, thanh toán và cung cấp các báo cáo thống kê cho quản lý.

### 📌 Phạm vi
- **Thành viên** (tất cả người dùng) có thể **đăng nhập / đăng xuất**.
- **Khách hàng**: đăng ký thành viên, tìm kiếm sản phẩm, đặt hàng online, mua tại quầy.
- **Nhân viên kho**: nhập hàng, cập nhật thông tin mặt hàng & nhà cung cấp, duyệt đơn online, xuất phiếu cho giao hàng.
- **Nhân viên bán hàng**: thực hiện bán hàng trực tiếp tại quầy.
- **Nhân viên giao hàng**: nhận phiếu xuất từ kho.
- **Nhân viên quản lý**: xem báo cáo thống kê (mặt hàng, nhà cung cấp, doanh thu, khách hàng).

### 🛠️ Mô tả chi tiết nghiệp vụ
- **Quản lý**
  - *Xem thống kê mặt hàng*: danh sách mặt hàng và doanh thu.
  - *Xem thống kê nhà cung cấp*: số lượng hàng nhập, giao dịch liên quan.
  - *Xem thống kê khách hàng*: chọn khoảng thời gian → thống kê doanh thu theo khách hàng.
- **Nhân viên kho**
  - *Nhập hàng*: tạo hoá đơn nhập, ghi nhận nhà cung cấp.
  - *Cập nhật mặt hàng / nhà cung cấp*: CRUD.
  - *Duyệt & xuất đơn online*: kiểm tra, tạo phiếu xuất.
- **Nhân viên bán hàng**
  - *Bán hàng tại quầy*: nhập sản phẩm, tính tiền, thanh toán.
- **Khách hàng**
  - *Đăng ký thành viên*: nhập thông tin → lưu vào CSDL → phản hồi thành công.
  - *Tìm kiếm & đặt hàng online*: thêm vào giỏ, gửi đơn.
  - *Mua hàng tại quầy*: mua trực tiếp và thanh toán.

### 📦 Đối tượng trong hệ thống
- **User** → `Customer`, `Staff` (sub‑class: `Manager`, `WarehouseStaff`, `SalesStaff`, `DeliveryStaff`).
- **Product** – mặt hàng bán.
- **Supplier** – nhà cung cấp.
- **Invoice** – `PurchaseInvoice` (nhập), `SalesInvoiceOnline`, `SalesInvoiceDirect`.
- **DeliveryNote** – phiếu xuất.
- **Report** – báo cáo thống kê.

### 🔗 Quan hệ thực thể (tóm tắt)
- `Customer 1‑n SalesInvoice*`
- `Product n‑n SalesInvoice*` → chi tiết `SalesInvoiceItem`.
- `Supplier 1‑n PurchaseInvoice*`
- `Product n‑n PurchaseInvoice*` → `PurchaseInvoiceItem`.
- `WarehouseStaff 1‑n DeliveryNote*`
- `DeliveryStaff 1‑n DeliveryNote*`

---

## 3️⃣ Use Case tổng quan (Mermaid)

```mermaid
flowchart TD
    actor Customer as C
    actor Manager as M
    actor Warehouse as W
    actor Sales as S
    actor Delivery as D

    C --> UC_Login[Đăng nhập]
    C --> UC_Register[Đăng ký thành viên]
    C --> UC_Search[Tìm kiếm/đặt hàng online]
    C --> UC_BuyAtCounter[Mua tại quầy]

    W --> UC_StockIn[Nhập hàng]
    W --> UC_UpdateProduct[Cập nhật mặt hàng]
    W --> UC_ApproveOrder[Duyệt đơn online]
    W --> UC_CreateDelivery[Xuất phiếu]

    S --> UC_SellAtCounter[Bán hàng tại quầy]

    M --> UC_ViewReport[Xem báo cáo]
    M --> UC_ViewReport --> UC_ReportProduct[Thống kê mặt hàng]
    M --> UC_ViewReport --> UC_ReportSupplier[Thống kê nhà cung cấp]
    M --> UC_ViewReport --> UC_ReportRevenue[Thống kê doanh thu / khách hàng]
```

---

## 4️⃣ Use Case chi tiết (2 ví dụ)

### 4.1 Đăng ký thành viên (Customer)
| **Bước** | **Mô tả** |
|---|---|
| 1 | Khách hàng chọn **Đăng ký** trên giao diện chính. |
| 2 | Form hiển thị các trường: Họ tên, Ngày sinh, SĐT, Email, Mật khẩu, Xác nhận mật khẩu. |
| 3 | Khách hàng nhập đầy đủ và nhấn **Đăng ký**. |
| 4 | Hệ thống **kiểm tra hợp lệ** (trống, định dạng, trùng SĐT). |
| 5a| Nếu hợp lệ → **tạo bản ghi** trong bảng `Customer` (hashed password) và trả **thông báo thành công**. |
| 5b| Nếu không hợp lệ → **hiển thị lỗi** chi tiết cho người dùng. |
| 6 | Người dùng được chuyển tới trang **đăng nhập**. |

### 4.2 Xem thống kê doanh thu khách hàng (Manager)
| **Bước** | **Mô tả** |
|---|---|
| 1 | Quản lý đăng nhập và vào **Dashboard**. |
| 2 | Chọn **Báo cáo → Thống kê doanh thu khách hàng**. |
| 3 | Nhập **ngày bắt đầu** và **ngày kết thúc** (VD: 01/09/2026 – 30/09/2026). |
| 4 | Hệ thống gọi stored procedure `TKKH726` → trả về danh sách `CustomerID, CustomerName, TotalRevenue`. |
| 5 | Kết quả hiển thị dưới dạng bảng, sắp xếp giảm dần theo **Doanh thu**. |
| 6 | Quản lý có thể **click** vào một khách hàng để xem chi tiết giao dịch (gọi `GetListHDM726` & `GetListHDTT726`). |
| 7 | Trang chi tiết hiển thị **hóa đơn online** + **hóa đơn trực tiếp** của khách trong khoảng thời gian đã chọn. |

---

## 5️⃣ Tài liệu tham khảo
- **Nguồn 1**: [NGUON_1_THONG_TIN_DE_TAI.md](file:///d:/PTTKHTTT/docs/NGUON_1_THONG_TIN_DE_TAI.md)
- **Nguồn 2**: [NGUON_2_BAO_CAO_MAU_PTTKHTTT_PTIT.md](file:///d:/PTTKHTTT/docs/NGUON_2_BAO_CAO_MAU_PTTKHTTT_PTIT.md)

> *Nếu cần xuất diagram Mermaid thành PNG, có thể sử dụng Mermaid CLI.*
