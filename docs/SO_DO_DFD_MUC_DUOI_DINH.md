# Sơ Đồ Luồng Dữ Liệu (DFD) Mức Dưới Đỉnh Cho Các Chức Năng Của Hệ Thống Web QLCafe

> **Quy chuẩn môn học:** Phân tích & Thiết kế Hệ thống Thông tin (PTTKHTTT).  
> **Loại sơ đồ:** Data Flow Diagram (DFD) Mức 2 (Mức dưới đỉnh / Phân rã chức năng).  
> **Quy ước chuẩn DFD (DeMarco / Yourdon):**
> - **Hình chữ nhật:** Thực thể ngoài (External Entity).
> - **Hình tròn:** Tiến trình xử lý (Process x.1, x.2...).
> - **2 đường gạch song song (trên và dưới, hở 2 đầu):** Kho dữ liệu (Data Store).
> - **Mũi tên có nhãn:** Luồng dữ liệu (Data Flow).

---

## 1. Chức Năng: Phân Hệ Thống Kê Và Báo Cáo (Khớp 100% ảnh mẫu)

Dán vào **[Mermaid Live Editor](https://mermaid.live/edit)** để xuất ảnh:

```mermaid
---
title: Chức năng phân hệ thống kê và báo cáo
---
flowchart TD
    %% Tác nhân ngoài
    Admin["Ban quản trị"]

    %% Tiến trình xử lý (Hình tròn)
    P5_1(("5.1. Thống kê<br/>kinh doanh"))
    P5_2(("5.2. Báo cáo<br/>định kỳ"))

    %% Kho dữ liệu (2 đường kẻ song song chuẩn DFD)
    D1["<div style='border-top:2px solid black; border-bottom:2px solid black; padding:4px 14px;'>Hóa đơn Doanh thu</div>"]
    D2["<div style='border-top:2px solid black; border-bottom:2px solid black; padding:4px 14px;'>Danh sách phòng / Bàn</div>"]
    D3["<div style='border-top:2px solid black; border-bottom:2px solid black; padding:4px 14px;'>Danh sách dịch vụ / Món</div>"]
    D4["<div style='border-top:2px solid black; border-bottom:2px solid black; padding:4px 14px;'>Hồ sơ nhân viên</div>"]
    D5["<div style='border-top:2px solid black; border-bottom:2px solid black; padding:4px 14px;'>Báo cáo thống kê</div>"]

    %% Luồng dữ liệu cho 5.1
    Admin -->|Yêu cầu thống kê kinh doanh| P5_1
    P5_1 -->|Kết quả thống kê kinh doanh| Admin
    P5_1 --> D1
    P5_1 --> D2
    P5_1 --> D3
    D4 --> P5_1

    %% Luồng liên kết giữa 5.1 và 5.2
    P5_1 -->|Dữ liệu thống kê tổng hợp| P5_2

    %% Luồng dữ liệu cho 5.2
    Admin -->|Yêu cầu báo cáo định kỳ| P5_2
    P5_2 -->|Báo cáo định kỳ| Admin
    P5_2 --> D5

    %% Style đen trắng học thuật: Ẩn viền bao ngoài kho dữ liệu để chỉ còn 2 vạch song song
    classDef entity fill:#ffffff,stroke:#000000,stroke-width:1.5px;
    classDef process fill:#ffffff,stroke:#000000,stroke-width:1.5px;
    classDef datastore fill:none,stroke:none;

    class Admin entity;
    class P5_1,P5_2 process;
    class D1,D2,D3,D4,D5 datastore;
```

---

## 2. Chức Năng: Phân Hệ Bán Hàng Tại Quầy (POS) & Xử Lý Đơn Hàng

```mermaid
---
title: Chức năng phân hệ bán hàng tại quầy và xử lý đơn hàng (POS)
---
flowchart TD
    %% Tác nhân
    Staff["Nhân viên thu ngân / Bán hàng"]
    Customer["Khách hàng"]

    %% Tiến trình
    P4_1(("4.1. Tiếp nhận &<br/>chọn món gọi"))
    P4_2(("4.2. Xử lý &<br/>chuyển bàn"))
    P4_3(("4.3. Thanh toán &<br/>in hóa đơn"))

    %% Kho dữ liệu (2 đường song song)
    D_Product["<div style='border-top:2px solid black; border-bottom:2px solid black; padding:4px 14px;'>Thực đơn món</div>"]
    D_Table["<div style='border-top:2px solid black; border-bottom:2px solid black; padding:4px 14px;'>Sơ đồ bàn</div>"]
    D_Order["<div style='border-top:2px solid black; border-bottom:2px solid black; padding:4px 14px;'>Hóa đơn bán hàng</div>"]
    D_Detail["<div style='border-top:2px solid black; border-bottom:2px solid black; padding:4px 14px;'>Chi tiết hóa đơn</div>"]

    %% Luồng dữ liệu 4.1
    Customer -->|Yêu cầu gọi món / Đặt chỗ| Staff
    Staff -->|Chọn bàn & danh sách món| P4_1
    D_Product -->|Thông tin giá & món còn hàng| P4_1
    P4_1 -->|Ghi nhận đơn tạm thời PENDING| D_Order
    P4_1 -->|Lưu danh sách món gọi| D_Detail
    P4_1 -->|Đổi trạng thái bàn sang OCCUPIED| D_Table

    %% Luồng dữ liệu 4.2 (Chuyển bàn)
    Staff -->|Yêu cầu đổi bàn| P4_2
    D_Table <-->|Kiểm tra & hoán đổi trạng thái bàn| P4_2
    P4_2 -->|Cập nhật bàn mới vào đơn| D_Order

    %% Luồng dữ liệu 4.3 (Thanh toán)
    Customer -->|Tiền mặt / Chuyển khoản QR| Staff
    Staff -->|Xác nhận thanh toán| P4_3
    D_Order -->|Đọc tổng tiền đơn hàng| P4_3
    P4_3 -->|Cập nhật trạng thái PAID| D_Order
    P4_3 -->|Giải phóng bàn về AVAILABLE| D_Table
    P4_3 -->|In hóa đơn thanh toán| Staff
    Staff -->|Giao hóa đơn & đồ uống| Customer

    %% Style đen trắng
    classDef entity fill:#ffffff,stroke:#000000,stroke-width:1.5px;
    classDef process fill:#ffffff,stroke:#000000,stroke-width:1.5px;
    classDef datastore fill:none,stroke:none;

    class Staff,Customer entity;
    class P4_1,P4_2,P4_3 process;
    class D_Product,D_Table,D_Order,D_Detail datastore;
```

---

## 3. Chức Năng: Phân Hệ Quản Lý Sơ Đồ Bàn

```mermaid
---
title: Chức năng phân hệ quản lý sơ đồ bàn
---
flowchart TD
    %% Tác nhân
    Manager["Quản lý quán"]
    Staff["Nhân viên phục vụ"]

    %% Tiến trình
    P3_1(("3.1. Thêm mới bàn"))
    P3_2(("3.2. Chỉnh sửa &<br/>xóa bàn"))
    P3_3(("3.3. Cập nhật<br/>trạng thái bàn"))

    %% Kho dữ liệu (2 đường song song)
    D_Table["<div style='border-top:2px solid black; border-bottom:2px solid black; padding:4px 14px;'>Sơ đồ bàn</div>"]
    D_Order["<div style='border-top:2px solid black; border-bottom:2px solid black; padding:4px 14px;'>Hóa đơn bán hàng</div>"]

    %% Luồng 3.1
    Manager -->|Nhập tên bàn mới| P3_1
    P3_1 -->|Lưu bàn mới AVAILABLE| D_Table
    P3_1 -->|Báo tạo bàn thành công| Manager

    %% Luồng 3.2
    Manager -->|Yêu cầu sửa tên / Xóa bàn| P3_2
    D_Table -->|Đọc thông tin & trạng thái bàn| P3_2
    D_Order -->|Kiểm tra hóa đơn PENDING| P3_2
    P3_2 -->|Cập nhật tên mới hoặc gán DELETED| D_Table
    P3_2 -->|Báo kết quả sửa/xóa bàn| Manager

    %% Luồng 3.3
    Staff -->|Báo khách vào / Dọn bàn| P3_3
    P3_3 <-->|Cập nhật AVAILABLE hoặc OCCUPIED| D_Table
    P3_3 -->|Hiển thị sơ đồ bàn trực quan| Staff

    %% Style
    classDef entity fill:#ffffff,stroke:#000000,stroke-width:1.5px;
    classDef process fill:#ffffff,stroke:#000000,stroke-width:1.5px;
    classDef datastore fill:none,stroke:none;

    class Manager,Staff entity;
    class P3_1,P3_2,P3_3 process;
    class D_Table,D_Order datastore;
```

---

## 4. Chức Năng: Phân Hệ Quản Lý Menu & Sản Phẩm

```mermaid
---
title: Chức năng phân hệ quản lý thực đơn và sản phẩm
---
flowchart TD
    %% Tác nhân
    Manager["Quản lý quán"]

    %% Tiến trình
    P2_1(("2.1. Quản lý<br/>danh mục món"))
    P2_2(("2.2. Thêm & cập nhật<br/>món uống"))
    P2_3(("2.3. Tải lên &<br/>lưu trữ ảnh món"))

    %% Kho dữ liệu (2 đường song song)
    D_Category["<div style='border-top:2px solid black; border-bottom:2px solid black; padding:4px 14px;'>Danh mục sản phẩm</div>"]
    D_Product["<div style='border-top:2px solid black; border-bottom:2px solid black; padding:4px 14px;'>Thực đơn món</div>"]
    D_Images["<div style='border-top:2px solid black; border-bottom:2px solid black; padding:4px 14px;'>Thư mục hình ảnh</div>"]

    %% Luồng 2.1
    Manager -->|Thêm / Sửa danh mục| P2_1
    P2_1 <-->|Đọc & Lưu danh mục| D_Category
    P2_1 -->|Kết quả danh mục| Manager

    %% Luồng 2.2
    Manager -->|Tên món, giá, danh mục| P2_2
    D_Category -->|Danh mục hợp lệ| P2_2
    P2_2 -->|Lưu thông tin sản phẩm| D_Product
    P2_2 -->|Báo lưu món thành công| Manager

    %% Luồng 2.3
    Manager -->|Tải tệp ảnh món (.jpg/.png)| P2_3
    P2_3 -->|Lưu trữ tệp vật lý| D_Images
    P2_3 -->|Trả về đường dẫn URL ảnh| P2_2

    %% Style
    classDef entity fill:#ffffff,stroke:#000000,stroke-width:1.5px;
    classDef process fill:#ffffff,stroke:#000000,stroke-width:1.5px;
    classDef datastore fill:none,stroke:none;

    class Manager entity;
    class P2_1,P2_2,P2_3 process;
    class D_Category,D_Product,D_Images datastore;
```

---

## 5. Chức Năng: Phân Hệ Quản Lý Nhân Sự

```mermaid
---
title: Chức năng phân hệ quản lý nhân sự
---
flowchart TD
    %% Tác nhân
    Manager["Ban quản lý (Admin)"]

    %% Tiến trình
    P6_1(("6.1. Quản lý<br/>hồ sơ nhân sự"))
    P6_2(("6.2. Cấp & phân quyền<br/>tài khoản"))
    P6_3(("6.3. Khóa / mở khóa<br/>tài khoản"))

    %% Kho dữ liệu (2 đường song song)
    D_Emp["<div style='border-top:2px solid black; border-bottom:2px solid black; padding:4px 14px;'>Hồ sơ nhân viên</div>"]
    D_Acc["<div style='border-top:2px solid black; border-bottom:2px solid black; padding:4px 14px;'>Tài khoản hệ thống</div>"]

    %% Luồng 6.1
    Manager -->|Họ tên, SĐT, CCCD, chức vụ, lương| P6_1
    P6_1 <-->|Đọc & ghi hồ sơ nhân viên| D_Emp
    P6_1 -->|Báo cập nhật hồ sơ thành công| Manager

    %% Luồng 6.2
    Manager -->|Tên đăng nhập, mật khẩu, vai trò| P6_2
    P6_2 -->|Kiểm tra trùng lặp & lưu Account| D_Acc
    P6_2 -->|Liên kết Account ID vào Nhân viên| D_Emp
    P6_2 -->|Báo tạo tài khoản thành công| Manager

    %% Luồng 6.3
    Manager -->|Yêu cầu khóa / kích hoạt| P6_3
    P6_3 <-->|Cập nhật isActive trong Account & Employee| D_Acc
    P6_3 -->|Thông báo trạng thái mới| Manager

    %% Style
    classDef entity fill:#ffffff,stroke:#000000,stroke-width:1.5px;
    classDef process fill:#ffffff,stroke:#000000,stroke-width:1.5px;
    classDef datastore fill:none,stroke:none;

    class Manager entity;
    class P6_1,P6_2,P6_3 process;
    class D_Emp,D_Acc datastore;
```
