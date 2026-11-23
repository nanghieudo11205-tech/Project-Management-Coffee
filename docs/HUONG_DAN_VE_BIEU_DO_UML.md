# Hướng Dẫn Vẽ Biểu Đồ UML & Lựa Chọn Công Cụ Cho Dự Án Quản Lý Quán Cà Phê (Web QLCafe)

> **Dành cho:** Báo cáo môn học Phân tích & Thiết kế Hệ thống Thông tin (PTTKHTTT), Đồ án Chuyên ngành, và Tài liệu Kỹ thuật Dự án.  
> **Dự án:** Hệ thống Website Quản Lý Quán Cà Phê (Next.js + Spring Boot + SQL Server + Google Gemini AI).

---

## 📑 MỤC LỤC
1. [Tổng Quan Về Các Loại Biểu Đồ Trong Dự Án](#1-tổng-quan-về-các-loại-biểu-đồ-trong-dự-án)
2. [Top Công Cụ Vẽ Biểu Đồ UML & Cách Sử Dụng](#2-top-công-cụ-vẽ-biểu-đồ-uml--cách-sử-dụng)
   - 2.1 [Nhóm 1: Code-as-Diagram (Mermaid & PlantUML)](#21-nhóm-1-code-as-diagram-mermaid--plantuml)
   - 2.2 [Nhóm 2: Kéo Thả Trực Quan (Draw.io, StarUML, Visual Paradigm)](#22-nhóm-2-kéo-thả-trực-quan-drawio-staruml-visual-paradigm)
   - 2.3 [Bảng So Sánh & Lời Khuyên Chọn Công Cụ](#23-bảng-so-sánh--lời-khuyên-chọn-công-cụ)
3. [Phần I: Biểu Đồ UML Toàn Hệ Thống](#3-phần-i-biểu-đồ-uml-toàn-hệ-thống)
   - 3.1 [Biểu đồ Use Case Tổng Thể (System Use Case Diagram)](#31-biểu-đồ-use-case-tổng-thể-system-use-case-diagram)
   - 3.2 [Biểu đồ Kiến Trúc Thành Phần (Component Diagram)](#32-biểu-đồ-kiến-trúc-thành-phần-component-diagram)
   - 3.3 [Biểu đồ Triển Khai (Deployment Diagram)](#33-biểu-đồ-triển-khai-deployment-diagram)
4. [Phần II: Biểu Đồ Lớp Thực Thể (Entity Class Diagram / Domain Model)](#4-phần-ii-biểu-đồ-lớp-thực-thể-entity-class-diagram--domain-model)
   - 4.1 [Cấu Trúc Các Thực Thể & Quan Hệ](#41-cấu-trúc-các-thực-thể--quan-hệ)
   - 4.2 [Mã Biểu Đồ Lớp Thực Thể (Mermaid)](#42-mã-biểu-đồ-lớp-thực-thể-mermaid)
   - 4.3 [Mã Biểu Đồ Lớp Thực Thể (PlantUML)](#43-mã-biểu-đồ-lớp-thực-thể-plantuml)
5. [Phần III: Biểu Đồ Của Các Module Chi Tiết Trong Dự Án](#5-phần-iii-biểu-đồ-của-các-module-chi-tiết-trong-dự-án)
   - 5.1 [Module 1: Xác Thực & Phân Quyền (Authentication & Authorization)](#51-module-1-xác-thực--phân-quyền-authentication--authorization)
   - 5.2 [Module 2: Bán Hàng & Xử Lý Đơn Hàng POS (Order & POS Module)](#52-module-2-bán-hàng--xử-lý-đơn-hàng-pos-order--pos-module)
   - 5.3 [Module 3: Quản Lý Sơ Đồ Bàn (Table Management)](#53-module-3-quản-lý-sơ-đồ-bàn-table-management)
   - 5.4 [Module 4: Quản Lý Menu & Sản Phẩm (Product & Category)](#54-module-4-quản-lý-menu--sản-phẩm-product--category)
   - 5.5 [Module 5: Quản Lý Nhân Sự (Employee Management)](#55-module-5-quản-lý-nhân-sự-employee-management)
   - 5.6 [Module 6: Thống Kê & Báo Cáo Doanh Thu (Revenue & Analytics)](#56-module-6-thống-kê--báo-cáo-doanh-thu-revenue--analytics)
   - 5.7 [Module 7: Trợ Lý Ảo AI Phân Tích Kinh Doanh (Gemini AI Assistant)](#57-module-7-trợ-lý-ảo-ai-phân-tích-kinh-doanh-gemini-ai-assistant)
6. [Quy Trình Từng Bước Vẽ & Xuất Ảnh Chèn Vào Báo Cáo](#6-quy-trình-từng-bước-vẽ--xuất-ảnh-chèn-vào-báo-cáo)

---

## 1. Tổng Quan Về Các Loại Biểu Đồ Trong Dự Án

Trong quy trình **Phân tích và Thiết kế Hệ thống Thông tin (PTTKHTTT)** theo phương pháp hướng đối tượng (OOAD), hệ thống `Web QLCafe` được mô hình hóa qua 3 cấp độ biểu đồ chính:

```
                              ┌──────────────────────────────────────────────┐
                              │            HỆ THỐNG QUẢN LÝ QUÁN CÀ PHÊ      │
                              └──────────────────────┬───────────────────────┘
                                                     │
         ┌───────────────────────────────────┼──────────────────────────────────┐
         │                                   │                                  │
         ▼                                   ▼                                  ▼
┌─────────────────────────┐       ┌─────────────────────────┐       ┌─────────────────────────┐
│   UML TOÀN HỆ THỐNG     │       │   BIỂU ĐỒ THỰC THỂ      │       │  BIỂU ĐỒ CÁC PHÂN HỆ   │
├─────────────────────────┤       ├─────────────────────────┤       ├─────────────────────────┤
│• Use Case Tổng thể      │       │• Domain Model           │       │• Design Class Diagrams  │
│• Component Diagram      │       │• Entity Class Diagram   │       │• Sequence Diagrams      │
│• Deployment Diagram     │       │• Thuộc tính, Kiểu dữ    │       │• State Machine Diagrams │
│  (Kiến trúc 3 tầng)     │       │  liệu, Khóa, Quan hệ    │       │  (Theo từng module)     │
└─────────────────────────┘       └─────────────────────────┘       └─────────────────────────┘
```

---

## 2. Top Công Cụ Vẽ Biểu Đồ UML & Cách Sử Dụng

### 2.1 Nhóm 1: Code-as-Diagram (Mermaid & PlantUML)

Ưu điểm vượt trội: Viết bằng văn bản/mã nguồn, dễ quản lý phiên bản qua Git, chỉnh sửa cực nhanh không lo lệch khối, tự động căn chỉnh bố cục.

#### 🌟 1. Mermaid.js (Tích hợp sẵn trong Markdown)
- **Đặc điểm:** Được hỗ trợ mặc định trên GitHub, GitLab, Notion, Obsidian, và Antigravity IDE.
- **Cách xem trước:** Trong VS Code, chỉ cần cài extension `Markdown Preview Mermaid Support` hoặc xem qua tính năng xem trước Markdown mặc định.
- **Cách dùng:** Đặt mã trong khối code block ` ```mermaid ` như các ví dụ bên dưới.
- **Xuất ảnh:** Có thể cài `mermaid-cli` (`npm install -g @mermaid-js/mermaid-cli`) và xuất ra ảnh bằng lệnh:
  ```bash
  mmdc -i diagram.mmd -o diagram.png -w 1920
  ```

#### 🌟 2. PlantUML (Tiêu chuẩn công nghiệp cho biểu đồ UML 2.x)
- **Đặc điểm:** Cực kỳ mạnh mẽ, hỗ trợ đầy đủ 14 loại biểu đồ UML theo chuẩn OMG.
- **Công cụ online miễn phí:** Truy cập [PlantText.com](https://www.planttext.com/) hoặc [PlantUML Server](https://www.plantuml.com/plantuml/uml/) để dán code và xuất ngay ảnh PNG/SVG chất lượng cao.
- **Extension VS Code:** Cài extension `PlantUML` (tác giả *jebbs*), bấm `Alt + D` để preview live.

---

### 2.2 Nhóm 2: Kéo Thả Trực Quan (Draw.io, StarUML, Visual Paradigm)

Dành cho việc trình bày đồ án học thuật, tiểu luận, slide bảo vệ đồ án tốt nghiệp cần tùy chỉnh màu sắc thẩm mỹ và layout tự do.

#### 🌟 1. Draw.io / diagrams.net (Miễn phí 100%, Đa năng nhất)
- **Link sử dụng:** [app.diagrams.net](https://app.diagrams.net/) (hoặc tải bản Desktop).
- **Extension trong VS Code:** Cài extension `Draw.io Integration`. Tạo tệp đuôi `.drawio.png` hoặc `.drawio.svg`, bạn vừa có thể xem như ảnh vừa có thể click mở giao diện kéo thả trực tiếp trong IDE!
- **Mẹo thông minh:** Trong Draw.io, chọn menu **Arrange -> Insert -> Advanced -> Mermaid** hoặc **PlantUML**, dán mã nguồn từ tài liệu này vào là Draw.io sẽ tự động dựng hình chuẩn 100%!

#### 🌟 2. StarUML (Chuẩn mực môn học PTTKHTTT tại các trường ĐH)
- **Đặc điểm:** Tuân thủ chuẩn UML 2.5 nghiêm ngặt, tự động kiểm tra cú pháp ngữ nghĩa (ví dụ: Actor chỉ nối với Use Case qua Association, không nối trực tiếp với Actor khác).
- **Tính năng:** Hỗ trợ mô hình hóa hướng đối tượng, sinh mã Java, sinh tài liệu báo cáo tự động.

#### 🌟 3. Visual Paradigm (Bộ công cụ phân tích thiết kế doanh nghiệp)
- **Đặc điểm:** Tích hợp đầy đủ từ mô hình hóa Use Case, Class, Sequence đến sơ đồ cơ sở dữ liệu (ERD) và ma trận CRUD.

---

### 2.3 Bảng So Sánh & Lời Khuyên Chọn Công Cụ

| Tiêu chí | Mermaid.js | PlantUML | Draw.io | StarUML |
|---|---|---|---|---|
| **Hình thức tạo** | Viết code trong Markdown | Viết mã script UML | Kéo thả đồ họa (GUI) | Kéo thả theo mô hình OOD |
| **Tốc độ vẽ & sửa** | ⚡ Cực nhanh | ⚡ Cực nhanh | ⏳ Trung bình (chỉnh tay) | ⏳ Trung bình |
| **Lưu trữ Git** | 100% Text diff dễ đọc | 100% Text diff dễ đọc | File XML / SVG | File JSON / .mdj |
| **Thẩm mỹ mặc định** | Hiện đại, phẳng | Cổ điển, rõ ràng | Tùy biến tự do cao | Chuẩn học thuật UML |
| **Phù hợp nhất khi** | Viết README, Docs dự án | Viết báo cáo kỹ thuật | Vẽ báo cáo Word, Luận văn | Nộp bài thực hành PTTKHTTT |

---

## 3. Phần I: Biểu Đồ UML Toàn Hệ Thống

### 3.1 Biểu đồ Use Case Tổng Thể (System Use Case Diagram)

Hệ thống phục vụ 3 nhóm tác nhân chính:
1. **Khách hàng (Customer)**: Xem thực đơn, đặt món online, xem giỏ hàng và lịch sử đơn.
2. **Nhân viên (Staff - Thu ngân/Bán hàng/Phục vụ)**: Bán hàng tại quầy (POS), quản lý sơ đồ bàn, phục vụ món, chuyển bàn, thanh toán hóa đơn.
3. **Quản lý / Quản trị viên (Manager / Admin)**: Toàn quyền nhân sự, danh mục, món uống, xem thống kê doanh thu đa chiều và trò chuyện với Trợ lý AI.
4. **Hệ thống liên kết ngoài**: Google OAuth2 Service (Xác thực đăng nhập), Google Gemini API (Phân tích thông minh).

#### Mã nguồn Mermaid (Render trực tiếp):
```mermaid
flowchart TD
    %% Tác nhân (Actors)
    actor Customer as "Khách hàng"
    actor Staff as "Nhân viên (Thu ngân / Phục vụ)"
    actor Admin as "Quản lý (Admin)"
    actor GoogleAuth as "Google OAuth2 Service"
    actor GeminiAI as "Google Gemini API"

    %% Nhóm Chức năng Xác thực
    subgraph SG_Auth ["Phân Hệ Xác Thực"]
        UC_Login["Đăng nhập hệ thống"]
        UC_LoginGoogle["Đăng nhập qua Google"]
        UC_Logout["Đăng xuất"]
        UC_ChangePass["Đổi mật khẩu"]
    end

    %% Nhóm Nghiệp vụ POS & Bàn
    subgraph SG_POS ["Phân Hệ Bán Hàng & Bàn"]
        UC_ViewMenu["Xem thực đơn đồ uống"]
        UC_ManageTables["Xem sơ đồ & trạng thái bàn"]
        UC_CreateOrder["Tạo đơn gọi món (POS)"]
        UC_SwitchTable["Chuyển bàn cho khách"]
        UC_Checkout["Thanh toán hóa đơn"]
        UC_PrintReceipt["In hóa đơn / Xuất phiếu"]
        UC_CancelOrder["Hủy đơn hàng"]
    end

    %% Nhóm Quản trị Menu & Kho
    subgraph SG_Admin_Product ["Phân Hệ Quản Trị Danh Mục & Món"]
        UC_ManageCategory["Quản lý danh mục"]
        UC_ManageProduct["Thêm / Sửa / Xóa món"]
        UC_UploadImage["Tải ảnh món uống"]
    end

    %% Nhóm Quản trị Nhân sự
    subgraph SG_Admin_HR ["Phân Hệ Quản Lý Nhân Sự"]
        UC_ManageEmployee["Quản lý thông tin nhân viên"]
        UC_ManageAccount["Cấp / Khóa tài khoản nhân viên"]
    end

    %% Nhóm Báo cáo & Trí tuệ nhân tạo
    subgraph SG_Report_AI ["Phân Hệ Thống Kê & Trợ Lý AI"]
        UC_ViewDashboard["Xem thống kê doanh thu"]
        UC_ChatAI["Trò chuyện với Trợ lý AI"]
        UC_PredictRevenue["Phân tích xu hướng kinh doanh"]
    end

    %% Quan hệ Tác nhân -> Use Case
    Customer --> UC_ViewMenu
    Customer --> UC_Login

    Staff --> UC_Login
    Staff --> UC_Logout
    Staff --> UC_ManageTables
    Staff --> UC_CreateOrder
    Staff --> UC_SwitchTable
    Staff --> UC_Checkout
    Staff --> UC_CancelOrder

    Admin --> UC_Login
    Admin --> UC_ManageCategory
    Admin --> UC_ManageProduct
    Admin --> UC_ManageEmployee
    Admin --> UC_ManageAccount
    Admin --> UC_ViewDashboard
    Admin --> UC_ChatAI

    %% Quan hệ Include / Extend & External
    UC_LoginGoogle -.->|<<extend>>| UC_Login
    UC_LoginGoogle --- GoogleAuth
    UC_UploadImage -.->|<<include>>| UC_ManageProduct
    UC_PrintReceipt -.->|<<include>>| UC_Checkout
    UC_ChatAI -.->|<<include>>| UC_PredictRevenue
    UC_ChatAI --- GeminiAI

    %% Kế thừa tác nhân: Admin kế thừa mọi quyền của Staff
    Admin -- "Kế thừa quyền" --> Staff
```

---

### 3.2 Biểu đồ Kiến Trúc Thành Phần (Component Diagram)

Hệ thống được thiết kế theo kiến trúc 3 tầng phân tán (Three-Tier Architecture) hiện đại, độc lập giữa giao diện (SPA/SSR) và tầng API nghiệp vụ (Headless REST).

```mermaid
flowchart TB
    subgraph ClientLayer ["1. Presentation Layer (Frontend - Next.js 15)"]
        direction TB
        UI_Pages["App Router (Pages)
        /login, /dashboard, /tables,
        /orders, /products, /employees"]
        UI_State["Client State & Cache
        (Zustand + TanStack Query v5)"]
        UI_Client["API Client Wrapper
        (Axios / Fetch + JWT Interceptor)"]
        UI_Pages --> UI_State --> UI_Client
    end

    subgraph ServerLayer ["2. Application / Business Layer (Backend - Spring Boot 3)"]
        direction TB
        subgraph SecurityFilter ["Security & Auth Filter"]
            JWT_Filter["JwtAuthenticationFilter
            (BCrypt, Token Validation)"]
        end

        subgraph Controllers ["REST Controllers"]
            C_Auth["AuthController"]
            C_Table["CafeTableController"]
            C_Order["OrderController"]
            C_Product["ProductController"]
            C_Employee["EmployeeController"]
            C_Revenue["RevenueController"]
        end

        subgraph Services ["Service Layer (Business Logic)"]
            S_Auth["AuthService"]
            S_Table["CafeTableService"]
            S_Order["OrderService"]
            S_Product["ProductService"]
            S_Employee["EmployeeService"]
            S_Storage["FileStorageService"]
        end

        subgraph Repositories ["Spring Data JPA Repositories"]
            R_Acc["AccountRepository"]
            R_Table["CafeTableRepository"]
            R_Order["OrderRepository"]
            R_Detail["OrderDetailRepository"]
            R_Prod["ProductRepository"]
            R_Emp["EmployeeRepository"]
        end

        JWT_Filter --> Controllers
        Controllers --> Services
        Services --> Repositories
    end

    subgraph DataLayer ["3. Data Persistence Layer (Database)"]
        direction TB
        SQL_DB[("Microsoft SQL Server
        - Tables: Account, CafeTable, Product...
        - View: vw_DailyRevenue
        - Stored Proc: sp_CheckoutOrder")]
    end

    subgraph ExternalLayer ["4. External Services"]
        Google_OAuth["Google OAuth2 API"]
        Gemini_API["Google Gemini 2.5 Flash"]
    end

    %% Tương tác liên tầng
    UI_Client -->|HTTP REST / JSON| JWT_Filter
    Repositories -->|JDBC / Hibernate| SQL_DB
    S_Auth -.->|Xác thực ID Token| Google_OAuth
    UI_Pages -.->|Proxy route /api/chat| Gemini_API
```

---

### 3.3 Biểu đồ Triển Khai (Deployment Diagram)

Mô tả sự phân bổ phần cứng, giao thức mạng và môi trường thực thi khi hệ thống vận hành thực tế.

```mermaid
deploymentDiagram
flowchart LR
    node_client["🖥️ Client Device
    (PC / POS Terminal / Tablet)
    - Chrome / Edge Browser
    - LocalStorage (Lưu JWT Token)"]

    node_web["☁️ Frontend Hosting Server (Vercel / Node.js)
    - Node.js Runtime (v20+)
    - Next.js Server Side Rendering (SSR)
    - Reverse Proxy API Route (/api/chat)"]

    node_app["⚙️ Backend Server (VPS / Cloud Server)
    - Java Runtime (OpenJDK 17 / 21)
    - Spring Boot Embedded Tomcat (Port 8080)
    - Spring Security & JWT Filter Engine"]

    node_db["🗄️ Database Server
    - Microsoft SQL Server 2022
    - Port: 1433
    - Database: TKQ_Cafe / QLCafe1"]

    node_cloud["🌐 Google Cloud Platform
    - Google Identity Platform (OAuth2)
    - Generative Language API (Gemini Flash)"]

    node_client -- "HTTPS (Port 443)" --> node_web
    node_client -- "HTTPS REST API (Port 8080/443)" --> node_app
    node_web -- "HTTPS (gRPC/REST)" --> node_cloud
    node_app -- "JDBC TCP Connection (Port 1433)" --> node_db
    node_app -- "HTTPS Verification" --> node_cloud
```

---

## 4. Phần II: Biểu Đồ Lớp Thực Thể (Entity Class Diagram / Domain Model)

Biểu đồ này mô hình hóa cấu trúc dữ liệu cốt lõi của dự án, phản ánh chính xác các JPA Entity trong gói `com.qlcafe.backend.entity` và bảng cơ sở dữ liệu `init.sql`.

### 4.1 Cấu Trúc Các Thực Thể & Quan Hệ

1. **Account (Tài khoản)**: Lưu thông tin đăng nhập, mật khẩu mã hóa BCrypt, vai trò (`ADMIN`, `STAFF`).
2. **Employee (Nhân viên)**: Thông tin lý lịch, lương, chức vụ; có quan hệ `1 - 1` với `Account`.
3. **Category (Danh mục)**: Nhóm đồ uống (Cà phê pha máy, Trà trái cây, Bánh ngọt); quan hệ `1 - n` với `Product`.
4. **Product (Sản phẩm)**: Tên món, giá bán, ảnh URL, trạng thái còn/hết hàng (`isAvailable`).
5. **CafeTable (Bàn cà phê)**: Sơ đồ bàn, trạng thái bàn (`AVAILABLE`, `OCCUPIED`, `DELETED`).
6. **Order (Hóa đơn)**: Đại diện cho 1 lần gọi món; liên kết với bàn (nếu ngồi tại chỗ) hoặc `NULL` (nếu mang về - Takeaway), nhân viên tạo đơn, tổng tiền, phương thức thanh toán.
7. **OrderDetail (Chi tiết hóa đơn)**: Thực thể liên kết giữa `Order` và `Product` (quan hệ nhiều - nhiều được chuẩn hóa), lưu số lượng, đơn giá tại thời điểm bán, ghi chú khách yêu cầu.

### 4.2 Mã Biểu Đồ Lớp Thực Thể (Mermaid)

```mermaid
classDiagram
    direction TB

    class Account {
        -Integer id
        -String username
        -String password
        -String role
        +getId() Integer
        +getUsername() String
        +getRole() String
    }

    class Employee {
        -Integer id
        -String fullName
        -String phoneNumber
        -String identityCard
        -LocalDate dateOfBirth
        -String position
        -LocalDate hireDate
        -Double salary
        -Boolean isActive
        +getFullName() String
        +getPosition() String
        +getSalary() Double
    }

    class Category {
        -Integer id
        -String name
        -String description
        +getId() Integer
        +getName() String
    }

    class Product {
        -Integer id
        -String name
        -Double price
        -String imageUrl
        -Boolean isAvailable
        +getId() Integer
        +getName() String
        +getPrice() Double
    }

    class CafeTable {
        -Integer id
        -String name
        -String status
        +getId() Integer
        +getName() String
        +getStatus() String
    }

    class Order {
        -Integer id
        -LocalDateTime createdAt
        -Double totalAmount
        -String status
        -String orderType
        -String paymentMethod
        +calculateTotal() Double
        +checkout(paymentMethod) void
    }

    class OrderDetail {
        -Integer id
        -Integer quantity
        -Double price
        -String note
        +getSubtotal() Double
    }

    %% Quan hệ giữa các thực thể
    Account "1" -- "0..1" Employee : sở hữu hồ sơ
    Account "1" -- "0..*" Order : tạo / thu ngân
    CafeTable "0..1" -- "0..*" Order : gán vị trí ngồi
    Category "1" -- "0..*" Product : phân loại món
    Order "1" *-- "1..*" OrderDetail : chứa (Composition)
    Product "1" -- "0..*" OrderDetail : chi tiết đặt món
```

### 4.3 Mã Biểu Đồ Lớp Thực Thể (PlantUML)

Dán đoạn mã dưới đây vào [PlantText](https://www.planttext.com/) hoặc PlantUML để xuất ảnh:

```plantuml
@startuml
skinparam classAttributeIconSize 0
skinparam monochrome false
skinparam roundcorner 10
skinparam shadowing true

title BIỂU ĐỒ LỚP THỰC THỂ (DOMAIN ENTITY CLASS DIAGRAM) - QL CAFE

class Account <<Entity>> {
    - id: Integer <<PK>>
    - username: String
    - password: String
    - role: String
    + getId(): Integer
    + getUsername(): String
}

class Employee <<Entity>> {
    - id: Integer <<PK>>
    - fullName: String
    - phoneNumber: String
    - identityCard: String
    - dateOfBirth: LocalDate
    - position: String
    - hireDate: LocalDate
    - salary: Double
    - isActive: Boolean
    + getFullName(): String
}

class Category <<Entity>> {
    - id: Integer <<PK>>
    - name: String
    - description: String
    + getId(): Integer
}

class Product <<Entity>> {
    - id: Integer <<PK>>
    - name: String
    - price: Double
    - imageUrl: String
    - isAvailable: Boolean
    + getId(): Integer
    + getPrice(): Double
}

class CafeTable <<Entity>> {
    - id: Integer <<PK>>
    - name: String
    - status: String
    + getId(): Integer
    + getStatus(): String
}

class Order <<Entity>> {
    - id: Integer <<PK>>
    - createdAt: LocalDateTime
    - totalAmount: Double
    - status: String
    - orderType: String
    - paymentMethod: String
    + calculateTotal(): Double
}

class OrderDetail <<Entity>> {
    - id: Integer <<PK>>
    - quantity: Integer
    - price: Double
    - note: String
    + getSubtotal(): Double
}

Account "1" <--> "0..1" Employee : Account_Employee (1-1)
Account "1" --> "0..*" Order : createdBy
CafeTable "0..1" --> "0..*" Order : assignedTable
Category "1" o-- "0..*" Product : categorizedUnder
Order "1" *-- "1..*" OrderDetail : containsDetails
Product "1" <-- "0..*" OrderDetail : refersToProduct

@enduml
```

---

## 5. Phần III: Biểu Đồ Của Các Module Chi Tiết Trong Dự Án

### 5.1 Module 1: Xác Thực & Phân Quyền (Authentication & Authorization)

#### Sơ đồ Tuần tự (Sequence Diagram): Đăng nhập tài khoản & Nhận JWT
```mermaid
sequenceDiagram
    autonumber
    actor User as "Người dùng (Admin/Staff)"
    participant UI as "Frontend (Login Page)"
    participant AuthCtrl as "AuthController"
    participant AuthSvc as "AuthService"
    participant AccRepo as "AccountRepository"
    participant JwtProvider as "JwtTokenProvider"

    User->>UI: Nhập username & password -> Bấm Đăng nhập
    UI->>AuthCtrl: POST /api/auth/login {username, password}
    AuthCtrl->>AuthSvc: login(loginRequest)
    AuthSvc->>AccRepo: findByUsername(username)
    AccRepo-->>AuthSvc: Trả về Account (kèm mật khẩu băm BCrypt)
    
    alt Không tìm thấy tài khoản hoặc mật khẩu sai
        AuthSvc-->>AuthCtrl: Ném ngoại lệ BadCredentialsException
        AuthCtrl-->>UI: HTTP 401 Unauthorized {message: "Sai tài khoản hoặc mật khẩu"}
        UI-->>User: Hiển thị thông báo Toast lỗi đỏ
    else Thông tin hợp lệ
        AuthSvc->>AuthSvc: passwordEncoder.matches(rawPassword, encodedPassword)
        AuthSvc->>JwtProvider: generateToken(Account)
        JwtProvider-->>AuthSvc: Chuỗi token JWT (AccessToken)
        AuthSvc-->>AuthCtrl: AuthResponse {token, username, role}
        AuthCtrl-->>UI: HTTP 200 OK {token, role, username}
        UI->>UI: Lưu Token vào LocalStorage & Zustand Store
        UI-->>User: Chuyển hướng tới trang /dashboard hoặc /orders
    end
```

---

### 5.2 Module 2: Bán Hàng & Xử Lý Đơn Hàng POS (Order & POS Module)

Đây là nghiệp vụ cốt lõi nhất của quán cà phê, gồm: Tạo đơn tại bàn, Chuyển bàn, và Thanh toán hóa đơn.

#### Sơ đồ Tuần tự (Sequence Diagram): Tạo đơn hàng tại bàn (POS Order Creation)
```mermaid
sequenceDiagram
    autonumber
    actor Staff as "Nhân viên thu ngân"
    participant POS_UI as "Giao diện POS (/orders)"
    participant OrderCtrl as "OrderController"
    participant OrderSvc as "OrderService"
    participant TableRepo as "CafeTableRepository"
    participant ProdRepo as "ProductRepository"
    participant OrderRepo as "OrderRepository"
    participant DetailRepo as "OrderDetailRepository"

    Staff->>POS_UI: Chọn Bàn (VD: Bàn 3), chọn món uống & số lượng
    Staff->>POS_UI: Nhấn nút "Tạo đơn hàng"
    POS_UI->>OrderCtrl: POST /api/orders {tableId: 3, orderType: "DINE_IN", details: [...]}
    OrderCtrl->>OrderSvc: createOrder(request)

    OrderSvc->>TableRepo: findById(tableId)
    TableRepo-->>OrderSvc: CafeTable (status: AVAILABLE)
    OrderSvc->>TableRepo: table.setStatus("OCCUPIED") -> save()
    
    OrderSvc->>OrderRepo: save(order mới với status="PENDING")
    OrderRepo-->>OrderSvc: Order instance

    loop Duyệt từng món trong details
        OrderSvc->>ProdRepo: findById(productId)
        ProdRepo-->>OrderSvc: Product
        OrderSvc->>DetailRepo: save(OrderDetail {order, product, quantity, price})
    end

    OrderSvc->>OrderRepo: order.setTotalAmount(tổng) -> save()
    OrderRepo-->>OrderSvc: Order hoàn tất
    OrderSvc-->>OrderCtrl: Order Entity
    OrderCtrl-->>POS_UI: HTTP 201 Created (Chi tiết hóa đơn)
    POS_UI-->>Staff: Báo tạo đơn thành công, Bàn 3 chuyển màu đỏ (Có khách)
```

#### Sơ đồ Tuần tự (Sequence Diagram): Thanh toán hóa đơn (Checkout Order)
```mermaid
sequenceDiagram
    autonumber
    actor Cashier as "Thu ngân"
    participant POS_UI as "POS Screen"
    participant OrderCtrl as "OrderController"
    participant OrderSvc as "OrderService"
    participant OrderRepo as "OrderRepository"
    participant TableRepo as "CafeTableRepository"

    Cashier->>POS_UI: Chọn đơn hàng -> Chọn PT thanh toán (Tiền mặt / Chuyển khoản) -> Bấm "Thanh toán"
    POS_UI->>OrderCtrl: POST /api/orders/{id}/checkout?paymentMethod=CASH
    OrderCtrl->>OrderSvc: checkout(orderId, "CASH")
    
    OrderSvc->>OrderRepo: findById(orderId)
    OrderRepo-->>OrderSvc: Order (status: PENDING)
    OrderSvc->>OrderSvc: order.setStatus("PAID")
    OrderSvc->>OrderSvc: order.setPaymentMethod("CASH")

    opt Đơn dùng tại bàn (table != null)
        OrderSvc->>TableRepo: table.setStatus("AVAILABLE")
        TableRepo-->>OrderSvc: Bàn được giải phóng (Màu xanh trống)
    end

    OrderSvc->>OrderRepo: save(order)
    OrderSvc-->>OrderCtrl: Order hoàn tất thanh toán
    OrderCtrl-->>POS_UI: HTTP 200 OK
    POS_UI-->>Cashier: Hiện thông báo "Thanh toán thành công" & Popup in hóa đơn
```

---

### 5.3 Module 3: Quản Lý Sơ Đồ Bàn (Table Management)

#### Biểu đồ Trạng thái của Bàn (State Machine Diagram)
```mermaid
stateDiagram-v2
    [*] --> AVAILABLE : Khởi tạo bàn mới

    AVAILABLE --> OCCUPIED : Khách vào bàn / Nhân viên tạo đơn PENDING
    OCCUPIED --> AVAILABLE : Thanh toán hóa đơn (Checkout) hoặc Hủy đơn
    OCCUPIED --> OCCUPIED : Chuyển món / Thêm món mới vào bàn
    
    OCCUPIED --> AVAILABLE : Đổi sang bàn khác (Bàn cũ được giải phóng)
    AVAILABLE --> OCCUPIED : Nhận đơn từ bàn khác chuyển sang

    AVAILABLE --> DELETED : Quản lý xóa bàn (Soft Delete - bàn đang trống)
    DELETED --> [*]

    note right of OCCUPIED
        Nếu bàn đang OCCUPIED,
        hệ thống chặn không cho
        sửa tên hoặc xóa bàn!
    end note
```

---

### 5.4 Module 4: Quản Lý Menu & Sản Phẩm (Product & Category)

#### Biểu đồ Lớp Thiết Kế Phân Tầng (Design Class Diagram - BCE Pattern)
```mermaid
classDiagram
    %% Boundary
    class ProductController {
        -ProductService productService
        +getAllProducts() ResponseEntity
        +getProductById(id) ResponseEntity
        +createProduct(ProductDTO, MultipartFile) ResponseEntity
        +updateProduct(id, ProductDTO, MultipartFile) ResponseEntity
        +deleteProduct(id) ResponseEntity
    }

    %% Control
    class ProductService {
        -ProductRepository productRepository
        -CategoryRepository categoryRepository
        -FileStorageService fileStorageService
        +getAllProducts() List~Product~
        +createProduct(dto, file) Product
        +updateProduct(id, dto, file) Product
        +deleteProduct(id) void
    }

    class FileStorageService {
        -String uploadDir
        +saveFile(MultipartFile file) String
        +deleteFile(String fileName) void
    }

    %% Entity / Data
    class ProductRepository {
        <<interface>>
        +findAll() List~Product~
        +findByCategoryId(categoryId) List~Product~
        +findByIsAvailableTrue() List~Product~
    }

    ProductController --> ProductService : calls
    ProductService --> FileStorageService : uploads image
    ProductService --> ProductRepository : interacts
```

---

### 5.5 Module 5: Quản Lý Nhân Sự (Employee Management)

#### Sơ đồ Tuần tự: Tiếp nhận nhân viên mới (Tạo tài khoản & Hồ sơ)
```mermaid
sequenceDiagram
    autonumber
    actor Admin as "Quản lý"
    participant UI as "Employee Page (/employees)"
    participant EmpCtrl as "EmployeeController"
    participant EmpSvc as "EmployeeService"
    participant AccRepo as "AccountRepository"
    participant EmpRepo as "EmployeeRepository"

    Admin->>UI: Điền thông tin nhân viên + username, password ban đầu
    Admin->>UI: Bấm "Lưu nhân viên"
    UI->>EmpCtrl: POST /api/employees {fullName, phone, salary, position, account: {username, role}}
    EmpCtrl->>EmpSvc: createEmployee(request)

    EmpSvc->>AccRepo: existsByUsername(username)
    alt Username đã tồn tại
        AccRepo-->>EmpSvc: true
        EmpSvc-->>EmpCtrl: Exception("Tên đăng nhập đã được sử dụng")
        EmpCtrl-->>UI: HTTP 400 Bad Request
        UI-->>Admin: Báo lỗi "Tên tài khoản đã tồn tại"
    else Hợp lệ
        EmpSvc->>AccRepo: save(Account mã hóa mật khẩu)
        AccRepo-->>EmpSvc: Account đã lưu
        EmpSvc->>EmpRepo: save(Employee liên kết Account)
        EmpRepo-->>EmpSvc: Employee mới
        EmpSvc-->>EmpCtrl: Employee Entity
        EmpCtrl-->>UI: HTTP 201 Created
        UI-->>Admin: Toast "Thêm nhân viên thành công", cập nhật bảng
    end
```

---

### 5.6 Module 6: Thống Kê & Báo Cáo Doanh Thu (Revenue & Analytics)

#### Sơ đồ Tuần tự: Truy vấn Doanh thu theo Mốc thời gian
```mermaid
sequenceDiagram
    autonumber
    actor Manager as "Quản lý"
    participant Dashboard as "Dashboard UI (/dashboard)"
    participant RevCtrl as "RevenueController"
    participant OrderRepo as "OrderRepository"
    participant DB as "SQL Server View/Query"

    Manager->>Dashboard: Mở Dashboard (chọn mốc xem: Day / Month / Year)
    Dashboard->>RevCtrl: GET /api/revenue/stats?type=day
    RevCtrl->>OrderRepo: findDailyRevenue()
    OrderRepo->>DB: SELECT CAST(created_at AS DATE), COUNT(*), SUM(total_amount) FROM Orders WHERE status='PAID' GROUP BY ...
    DB-->>OrderRepo: List of raw records [Date, TotalOrders, Revenue]
    OrderRepo-->>RevCtrl: List Object[]
    RevCtrl->>RevCtrl: Map sang List RevenueDTO
    RevCtrl-->>Dashboard: HTTP 200 OK [ {date: "2026-11-23", orders: 42, revenue: 2150000}, ... ]
    Dashboard->>Dashboard: Chart.js vẽ biểu đồ cột & đường doanh thu
    Dashboard-->>Manager: Hiển thị biểu đồ trực quan, KPI tổng
```

---

### 5.7 Module 7: Trợ Lý Ảo AI Phân Tích Kinh Doanh (Gemini AI Assistant)

Module ứng dụng mô hình ngôn ngữ lớn **Google Gemini 2.5 Flash** để tự động phân tích dữ liệu bán hàng và đề xuất chiến lược kinh doanh cho quản lý quán cà phê.

```mermaid
sequenceDiagram
    autonumber
    actor Manager as "Quản lý quán"
    participant AI_UI as "Giao diện Trợ Lý AI (/ai-assistant)"
    participant NextRoute as "Next.js API Route (/api/chat)"
    participant SpringBackend as "Spring Boot API"
    participant GeminiAPI as "Google Gemini API (gemini-2.5-flash)"

    Manager->>AI_UI: Gõ câu hỏi (VD: "Món nào bán chạy nhất tuần này và gợi ý combo giúp tăng doanh thu?")
    AI_UI->>SpringBackend: Lấy snapshot dữ liệu (Doanh thu gần nhất, Top sản phẩm bán chạy)
    SpringBackend-->>AI_UI: Context Data {topSellingProducts, dailyRevenue, ...}

    AI_UI->>NextRoute: POST /api/chat {message, contextData, history}
    NextRoute->>NextRoute: Ghép System Instruction + Dữ liệu thực tế quán + Prompt
    NextRoute->>GeminiAPI: model.generateContent(fullPrompt)
    
    Note over NextRoute,GeminiAPI: LLM phân tích số liệu thực tế từ database
    GeminiAPI-->>NextRoute: Phản hồi văn bản thông minh (Markdown text)
    NextRoute-->>AI_UI: JSON {response: "..."}
    AI_UI-->>Manager: Hiển thị câu trả lời phân tích sâu sắc & gợi ý chiến lược
```

---

## 6. Quy Trình Từng Bước Vẽ & Xuất Ảnh Chèn Vào Báo Cáo

Nếu bạn cần xuất các biểu đồ trên thành file ảnh (.PNG hoặc .SVG) chất lượng cao để chèn vào báo cáo Word hoặc Slide bảo vệ đồ án:

### Bước 1: Chọn công cụ
- **Cách 1 (Nhanh nhất - Không cần cài đặt):**
  1. Sao chép khối mã **Mermaid** trong file này.
  2. Mở trang [Mermaid Live Editor](https://mermaid.live/).
  3. Dán mã vào khung bên trái.
  4. Khung bên phải sẽ hiển thị biểu đồ ngay lập tức -> Nhấn **Actions -> Download PNG / SVG**.

- **Cách 2 (Sử dụng Draw.io để tinh chỉnh vị trí theo ý muốn):**
  1. Mở [Draw.io](https://app.diagrams.net/).
  2. Tạo biểu đồ mới trống.
  3. Vào menu **Arrange** -> **Insert** -> **Advanced** -> Chọn **Mermaid**.
  4. Dán mã Mermaid vào và bấm **Insert**.
  5. Bạn có thể tự do chỉnh màu sắc, font chữ tiếng Việt, kéo các khối cho gọn gàng.
  6. Vào **File** -> **Export as** -> **PNG** (chọn độ phân giải 300 DPI để in ấn sắc nét).

- **Cách 3 (Sử dụng PlantUML):**
  1. Sao chép mã PlantUML (mục 4.3).
  2. Mở [PlantText.com](https://www.planttext.com/).
  3. Dán mã và bấm **Refresh**.
  4. Bấm **Export** để tải ảnh.

### Bước 2: Quy chuẩn trình bày trong báo cáo PTTKHTTT
Khi đưa vào bài báo cáo hoặc đồ án, hãy luôn đặt kèm:
- **Tên hình chuẩn:** `Hình x.y: <Tên biểu đồ>` (Ví dụ: *Hình 3.1: Biểu đồ Use Case tổng thể hệ thống QLCafe*).
- **Mô tả ngắn bên dưới hình:** Liệt kê các tác nhân tham gia và ý nghĩa của các luồng xử lý chính.
