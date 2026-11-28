import os
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def create_full_report():
    doc2_path = r'C:/Users/LENOVO/.gemini/antigravity/brain/2a5bb359-5fe0-4630-9ae2-9283ba8b0a38/.user_uploaded/media_1795452828206_cf4251c9.docx'
    if not os.path.exists(doc2_path):
        doc2_path = r'd:\PTTKHTTT\BAO_CAO_BTL_PTTKHTTT_DO_NANG_HIEU_B23DVCN058.docx'
    doc = Document(doc2_path)

    # 1. Clean up body after cover page
    for t in doc.tables:
        t._element.getparent().remove(t._element)

    for p in doc.paragraphs[20:]:
        p._element.getparent().remove(p._element)

    # Update Cover Page Info
    # P06: Title
    doc.paragraphs[6].text = "ĐỀ TÀI: HỆ THỐNG QUẢN LÝ QUÁN CÀ PHÊ\n(COFFEE CHILL MANAGEMENT SYSTEM)"
    doc.paragraphs[6].alignment = WD_ALIGN_PARAGRAPH.CENTER
    for r in doc.paragraphs[6].runs:
        r.font.name = 'Times New Roman'
        r.font.size = Pt(15)
        r.font.bold = True
        r.font.color.rgb = RGBColor(0, 51, 102)

    # P08: GVHD
    doc.paragraphs[8].text = "Giảng viên hướng dẫn \t: ThS. Vũ Đình Tân"
    doc.paragraphs[9].text = "Họ và tên \t\t: Đỗ Năng Hiệu"
    doc.paragraphs[10].text = "Mã sinh viên \t\t: B23DVCN058 (N21DCCN0726)"
    doc.paragraphs[11].text = "Nhóm lớp \t\t: VH11 - Khoa CNTT 1"
    
    for idx in [8, 9, 10, 11]:
        p = doc.paragraphs[idx]
        for r in p.runs:
            r.font.name = 'Times New Roman'
            r.font.size = Pt(12)
            r.font.bold = True

    # Section 2 settings
    new_section = doc.add_section()
    new_section.top_margin = Cm(2.0)
    new_section.bottom_margin = Cm(2.0)
    new_section.left_margin = Cm(2.5)
    new_section.right_margin = Cm(2.0)

    # Helper styling functions
    def add_h1(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(14)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.keep_with_next = True
        r = p.add_run(text)
        r.font.name = 'Times New Roman'
        r.font.size = Pt(14)
        r.font.bold = True
        r.font.color.rgb = RGBColor(31, 78, 121)
        return p

    def add_h2(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(10)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        r = p.add_run(text)
        r.font.name = 'Times New Roman'
        r.font.size = Pt(13)
        r.font.bold = True
        r.font.color.rgb = RGBColor(47, 85, 151)
        return p

    def add_h3(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(6)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.keep_with_next = True
        r = p.add_run(text)
        r.font.name = 'Times New Roman'
        r.font.size = Pt(12)
        r.font.bold = True
        r.font.italic = True
        r.font.color.rgb = RGBColor(50, 50, 50)
        return p

    def add_p(text, bold_prefix="", italic_prefix=""):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.line_spacing = 1.25

        if bold_prefix:
            rb = p.add_run(bold_prefix)
            rb.font.name = 'Times New Roman'
            rb.font.size = Pt(12)
            rb.font.bold = True

        if italic_prefix:
            ri = p.add_run(italic_prefix)
            ri.font.name = 'Times New Roman'
            ri.font.size = Pt(12)
            ri.font.italic = True

        r = p.add_run(text)
        r.font.name = 'Times New Roman'
        r.font.size = Pt(12)
        return p

    def add_bullet(text, bold_prefix=""):
        p = doc.add_paragraph(style='List Bullet')
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.line_spacing = 1.2
        if bold_prefix:
            rb = p.add_run(bold_prefix)
            rb.font.name = 'Times New Roman'
            rb.font.size = Pt(11.5)
            rb.font.bold = True
        r = p.add_run(text)
        r.font.name = 'Times New Roman'
        r.font.size = Pt(11.5)
        return p

    img_dir = r'd:\PTTKHTTT\docs\extracted_images'

    def add_fig(img_name, caption_text, width_inch=5.9):
        img_path = os.path.join(img_dir, img_name)
        if not os.path.exists(img_path):
            print(f"Warning: image {img_path} does not exist!")
            return
        p_img = doc.add_paragraph()
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.paragraph_format.space_before = Pt(6)
        p_img.paragraph_format.space_after = Pt(2)
        r = p_img.add_run()
        r.add_picture(img_path, width=Inches(width_inch))

        p_cap = doc.add_paragraph()
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap.paragraph_format.space_before = Pt(2)
        p_cap.paragraph_format.space_after = Pt(8)
        rc = p_cap.add_run(caption_text)
        rc.font.name = 'Times New Roman'
        rc.font.size = Pt(10.5)
        rc.font.italic = True
        rc.font.bold = True
        rc.font.color.rgb = RGBColor(80, 80, 80)

    def style_table(tbl, col_widths=None):
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        for i, row in enumerate(tbl.rows):
            # prevent row split across pages
            trPr = row._tr.get_or_add_trPr()
            trPr.append(parse_xml(f'<w:cantSplit {nsdecls("w")}/>'))
            if i == 0:
                trPr.append(parse_xml(f'<w:tblHeader {nsdecls("w")}/>'))

            for j, cell in enumerate(row.cells):
                cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
                tcPr = cell._tc.get_or_add_tcPr()
                tcMar = parse_xml(f'''
                    <w:tcMar {nsdecls("w")}>
                        <w:top w:w="80" w:type="dxa"/>
                        <w:bottom w:w="80" w:type="dxa"/>
                        <w:left w:w="120" w:type="dxa"/>
                        <w:right w:w="120" w:type="dxa"/>
                    </w:tcMar>
                ''')
                tcPr.append(tcMar)

                borders = parse_xml(f'''
                    <w:tcBorders {nsdecls("w")}>
                        <w:top w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>
                        <w:left w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>
                        <w:bottom w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>
                        <w:right w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>
                    </w:tcBorders>
                ''')
                tcPr.append(borders)

                if i == 0:
                    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="1F4E79"/>')
                    tcPr.append(shd)
                    for cp in cell.paragraphs:
                        cp.alignment = WD_ALIGN_PARAGRAPH.CENTER
                        for cr in cp.runs:
                            cr.font.name = 'Times New Roman'
                            cr.font.size = Pt(10.5)
                            cr.font.bold = True
                            cr.font.color.rgb = RGBColor(255, 255, 255)
                else:
                    if i % 2 == 1:
                        shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="F9FBFD"/>')
                        tcPr.append(shd)
                    for cp in cell.paragraphs:
                        for cr in cp.runs:
                            cr.font.name = 'Times New Roman'
                            cr.font.size = Pt(10)

                if col_widths and j < len(col_widths):
                    cell.width = Inches(col_widths[j])

    def add_code_block(code_text):
        tbl = doc.add_table(rows=1, cols=1)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        cell = tbl.cell(0, 0)
        tcPr = cell._tc.get_or_add_tcPr()
        shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="F2F4F7"/>')
        tcPr.append(shd)
        borders = parse_xml(f'''
            <w:tcBorders {nsdecls("w")}>
                <w:top w:val="single" w:sz="6" w:space="0" w:color="B0C4DE"/>
                <w:left w:val="single" w:sz="18" w:space="0" w:color="1F4E79"/>
                <w:bottom w:val="single" w:sz="6" w:space="0" w:color="B0C4DE"/>
                <w:right w:val="single" w:sz="6" w:space="0" w:color="B0C4DE"/>
            </w:tcBorders>
        ''')
        tcPr.append(borders)
        p = cell.paragraphs[0]
        p.paragraph_format.space_before = Pt(4)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.line_spacing = 1.15
        r = p.add_run(code_text)
        r.font.name = 'Consolas'
        r.font.size = Pt(9.5)
        r.font.color.rgb = RGBColor(20, 20, 20)
        p_after = doc.add_paragraph()
        p_after.paragraph_format.space_before = Pt(0)
        p_after.paragraph_format.space_after = Pt(4)

    print("Setup completed. Building document body...")

    # ==========================================
    # PHẦN I: PHA ĐẶC TẢ HỆ THỐNG
    # ==========================================
    add_h1("PHẦN I: PHA ĐẶC TẢ HỆ THỐNG (SYSTEM SPECIFICATION PHASE)")

    add_h2("1.1. Mô tả bài toán & Mô tả ngôn ngữ tự nhiên")
    add_h3("1.1.1. Mục đích xây dựng hệ thống")
    add_p("Hệ thống Quản lý Quán Cà phê (Coffee Chill Management System) được thiết kế nhằm tự động hóa và tin học hóa toàn diện quy trình vận hành chuỗi cửa hàng cà phê hiện đại. Hệ thống tích hợp xử lý bán hàng trực tiếp tại quầy/bàn (POS System) với sơ đồ bàn trực quan theo thời gian thực, quản lý thực đơn danh mục đồ uống, quản lý nhân sự cửa hàng, thống kê doanh thu và tích hợp Trợ lý Trí tuệ Nhân tạo (Google Gemini AI Assistant) hỗ trợ phân tích kinh doanh.")

    add_h3("1.1.2. Phạm vi hệ thống & Đối tượng tham gia")
    add_p("Hệ thống phục vụ các nhóm người dùng và tác nhân sau:")
    add_bullet("Xem thực đơn trực quan, gọi món tại bàn/tại quầy thông qua nhân viên, hoặc đặt đơn trực tuyến / mang về trên web (hệ thống lưu vào bảng Orders với order_type = 'ONLINE' hoặc 'TAKEAWAY'), thanh toán bằng tiền mặt hoặc chuyển khoản QR.", bold_prefix="Khách hàng (Customer): ")
    add_bullet("Theo dõi sơ đồ bàn theo thời gian thực, cập nhật trạng thái bàn khi có khách vào (OCCUPIED) hoặc sau khi hoàn tất dọn bàn (AVAILABLE).", bold_prefix="Nhân viên phục vụ (Server): ")
    add_bullet("Vận hành màn hình bán hàng POS, tiếp nhận order tại bàn (order_type = 'DINE_IN'), đơn mang về ('TAKEAWAY') hoặc đơn đặt trực tuyến ('ONLINE'), kiểm tra giá, lưu đơn tạm tính (PENDING), thực hiện chuyển bàn/gộp bàn, thanh toán hoàn tất đơn (PAID) và in hóa đơn cho khách.", bold_prefix="Nhân viên thu ngân (Cashier): ")
    add_bullet("Toàn quyền quản lý danh mục và thực đơn món đồ uống (thêm, sửa, đổi giá, tải ảnh đại diện); quản lý sơ đồ bàn (thêm bàn, đổi tên, xóa mềm DELETED); quản lý nhân viên (tạo tài khoản, phân quyền, cấu hình trạng thái hoạt động); theo dõi biểu đồ doanh thu và trò chuyện cùng Trợ lý ảo AI Gemini.", bold_prefix="Quản lý / Ban quản trị (Admin): ")
    add_bullet("Google OAuth2 Service (xác thực đăng nhập một chạm an toàn) và Google Gemini AI API (tiếp nhận dữ liệu kinh doanh, phân tích xu hướng bán chạy và tư vấn chiến lược).", bold_prefix="Hệ thống ngoài (External Services): ")

    add_h2("1.2. Bảng phân loại từ khóa nghiệp vụ")
    add_p("Quá trình phân tích cú pháp ngôn ngữ tự nhiên đã trích xuất danh sách các từ khóa được phân thành 3 nhóm cơ bản:")

    tbl_kw = doc.add_table(rows=4, cols=3)
    kw_data = [
        ["Nhóm Tác nhân (Actors)", "Nhóm Hoạt động (Verbs)", "Nhóm Thực thể / Đối tượng (Entities)"],
        ["Khách hàng (Customer)\nQuản lý (Admin)\nThu ngân (Cashier)", "Đăng nhập, Đăng xuất, Xác thực OAuth2\nGọi món (Order POS), Thêm ghi chú\nĐổi trạng thái bàn, Chuyển bàn", "Tài khoản (Account)\nBàn (CafeTable)\nĐồ uống (Product / MenuItem)"],
        ["Phục vụ (Server)\nTrợ lý ảo AI (Gemini Agent)\nGoogle Identity Provider", "Tách hóa đơn, In hóa đơn thanh toán\nThống kê doanh thu, Xuất báo cáo\nHỏi đáp phân tích kinh doanh AI", "Hóa đơn (Orders)\nChi tiết hóa đơn (OrderDetail)\nDanh mục (Category)"],
        ["Khách hàng thành viên\nBan quản trị cửa hàng", "Cấp & phân quyền tài khoản nhân viên\nKhóa / Kích hoạt tài khoản nhân sự\nXóa mềm bàn (Soft Delete)", "Hồ sơ nhân viên (Employee)\nBáo cáo doanh thu (RevenueReport)\nHộp thoại Trợ lý AI (ChatSession)"]
    ]
    for r_idx, row in enumerate(kw_data):
        for c_idx, val in enumerate(row):
            tbl_kw.cell(r_idx, c_idx).text = val
    style_table(tbl_kw, [2.0, 2.3, 2.3])

    add_h2("1.3. Phân rã chức năng hệ thống (Biểu đồ luồng dữ liệu DFD Mức dưới đỉnh)")
    add_p("Căn cứ vào kiến trúc nghiệp vụ, hệ thống được phân rã thành 6 phân hệ cốt lõi với biểu đồ DFD Mức 2 (Mức dưới đỉnh) tuân thủ quy chuẩn DeMarco / Yourdon (tiến trình hình tròn, kho dữ liệu 2 đường kẻ song song):")

    add_h3("1.3.1. Phân hệ 1.0: Xác thực và Phân quyền (Authentication)")
    add_p("Xử lý tiếp nhận thông tin đăng nhập truyền thống (Username/Password mã hóa BCrypt) hoặc xác thực qua Google OAuth2 Token, cấp phát JWT Token định danh người dùng.")
    add_fig("f1_image2.png", "Hình 1.1: Biểu đồ luồng dữ liệu (DFD) - Phân hệ Xác thực và Phân quyền")

    add_h3("1.3.2. Phân hệ 2.0: Quản lý Nhân sự & Người dùng")
    add_p("Admin tạo hồ sơ nhân viên, cấp tài khoản tương ứng, gán chức vụ và cấu hình trạng thái hoạt động (isActive).")
    add_fig("f1_image3.png", "Hình 1.2: Biểu đồ luồng dữ liệu (DFD) - Phân hệ Quản lý Nhân sự")

    add_h3("1.3.3. Phân hệ 3.0: Quản lý Thực đơn & Món đồ uống")
    add_p("Admin cập nhật danh mục, thiết lập đơn giá, tải ảnh đại diện lên thư mục lưu trữ và cấu hình hiển thị món trên thực đơn.")
    add_fig("f1_image4.png", "Hình 1.3: Biểu đồ luồng dữ liệu (DFD) - Phân hệ Quản lý Thực đơn & Sản phẩm")

    add_h3("1.3.4. Phân hệ 4.0: Quản lý Sơ đồ bàn & Trạng thái bàn")
    add_p("Admin thêm mới bàn (AVAILABLE), sửa tên bàn hoặc xóa mềm (DELETED) khi bàn không vướng hóa đơn PENDING; Phục vụ cập nhật trạng thái bàn khi khách nhận chỗ.")
    add_fig("f1_image5.png", "Hình 1.4: Biểu đồ luồng dữ liệu (DFD) - Phân hệ Quản lý Sơ đồ bàn")

    add_h3("1.3.5. Phân hệ 5.0: Bán hàng tại quầy (POS) & Xử lý đơn hàng")
    add_p("Thu ngân tiếp nhận món, kiểm tra giá, lưu hóa đơn PENDING, xử lý yêu cầu chuyển bàn giữa 2 vị trí, thực hiện thanh toán chuyển trạng thái PAID và in hóa đơn giao khách.")
    add_fig("f1_image6.png", "Hình 1.5: Biểu đồ luồng dữ liệu (DFD) - Phân hệ Bán hàng POS & Xử lý đơn hàng")

    add_h3("1.3.6. Phân hệ 6.0: Thống kê Kinh doanh & Báo cáo Doanh thu")
    add_p("Tổng hợp dữ liệu từ Hóa đơn doanh thu, Sơ đồ bàn, Danh mục món và Nhân sự nhằm cung cấp các bảng biểu báo cáo định kỳ cho Ban quản trị.")
    add_fig("f1_image7.png", "Hình 1.6: Biểu đồ luồng dữ liệu (DFD) - Phân hệ Thống kê Kinh doanh & Báo cáo")

    add_h2("1.4. Biểu đồ Use Case tổng quan toàn hệ thống")
    add_p("Biểu đồ Use Case tổng thể mô tả các mối quan hệ tương tác giữa các tác nhân người dùng và dịch vụ ngoài với hệ thống:")
    add_fig("f1_image1.png", "Hình 1.7: Sơ đồ Use Case tổng quan toàn hệ thống Quản lý Quán Cà phê")

    add_p("Danh sách tổng hợp các Use Case chức năng trên hệ thống:")
    tbl_uc = doc.add_table(rows=8, cols=4)
    uc_list = [
        ["Mã UC", "Tên Use Case", "Tác nhân chính", "Mô tả nghiệp vụ"],
        ["UC-01", "Đăng nhập & Phân quyền", "Thành viên, Google OAuth2", "Xác thực danh tính bằng tài khoản hoặc Google ID Token, cấp quyền JWT."],
        ["UC-02", "Bán hàng POS & Xử lý đơn hàng", "Thu ngân, Khách hàng", "Tiếp nhận gọi món tại bàn (DINE_IN), mang về (TAKEAWAY) hoặc đặt trực tuyến (ONLINE) lưu vào bảng Orders (order_type), chuyển bàn, thanh toán và in hóa đơn."],
        ["UC-03", "Quản lý Sơ đồ bàn", "Quản lý, Phục vụ", "Quản lý thêm/sửa/xóa mềm bàn; Phục vụ cập nhật trạng thái bàn trống/có khách."],
        ["UC-04", "Quản lý Thực đơn & Món", "Quản lý (Admin)", "Thêm/sửa danh mục đồ uống, cập nhật giá, trạng thái còn/hết và tải ảnh món."],
        ["UC-05", "Quản lý Nhân sự", "Quản lý (Admin)", "Tạo hồ sơ nhân viên, cấp tài khoản đăng nhập, cấu hình lương và chức vụ."],
        ["UC-06", "Thống kê Doanh thu", "Quản lý (Admin)", "Xem báo cáo doanh thu theo ngày/tháng, top sản phẩm bán chạy, lịch sử đơn."],
        ["UC-07", "Hỏi đáp Trợ lý AI Gemini", "Quản lý, Gemini AI API", "Trò chuyện trực tiếp cùng AI để phân tích số liệu kinh doanh và dự báo nguyên liệu."]
    ]
    for r_idx, row in enumerate(uc_list):
        for c_idx, val in enumerate(row):
            tbl_uc.cell(r_idx, c_idx).text = val
    style_table(tbl_uc, [0.8, 1.8, 1.8, 2.2])

    add_h2("1.5. Kịch bản đặc tả Use Case trọng tâm")
    add_h3("1.5.1. Kịch bản Use Case UC-02: Bán hàng tại quầy (POS) & Xử lý đơn hàng")

    tbl_scen = doc.add_table(rows=6, cols=2)
    scen_data = [
        ["Thuộc tính", "Nội dung đặc tả chi tiết"],
        ["Tên Use Case", "UC-02: Gọi món tại bàn và Thanh toán tại quầy (POS Sales)"],
        ["Tác nhân (Actors)", "Thu ngân (Main Actor), Khách hàng, Nhân viên phục vụ"],
        ["Tiền điều kiện", "Thu ngân đã đăng nhập hệ thống thành công. Sơ đồ bàn và Thực đơn món đã khởi tạo."],
        ["Luồng sự kiện chính\n(Basic Flow)", "1. Thu ngân mở màn hình POS, chọn bàn trống (AVAILABLE) trên sơ đồ bàn trực quan.\n2. Thu ngân tìm kiếm và chọn các món đồ uống theo yêu cầu từ thực đơn.\n3. Hệ thống tự động tính tổng tiền hóa đơn và ghi nhận danh sách chi tiết (OrderDetail).\n4. Thu ngân bấm 'Tạo đơn', trạng thái bàn chuyển sang OCCUPIED, hóa đơn lưu PENDING.\n5. Khi khách thanh toán, Thu ngân chọn phương thức (Tiền mặt / QR Banking), in hóa đơn hoàn tất.\n6. Trạng thái hóa đơn chuyển sang PAID, trạng thái bàn tự động giải phóng về AVAILABLE."],
        ["Ngoại lệ (Exceptions)", "2a. Món đồ uống tạm hết nguyên liệu: Hệ thống cảnh báo và từ chối thêm vào đơn.\n4a. Khách đổi bàn: Thu ngân bấm 'Chuyển bàn', hệ thống kiểm tra bàn đích AVAILABLE, chuyển đơn và giải phóng bàn cũ."]
    ]
    for r_idx, row in enumerate(scen_data):
        for c_idx, val in enumerate(row):
            tbl_scen.cell(r_idx, c_idx).text = val
    style_table(tbl_scen, [1.8, 4.8])

    add_h2("1.6. Yêu cầu phi chức năng (Non-Functional Requirements)")
    add_bullet("Mật khẩu người dùng được băm mã hóa một chiều bằng BCrypt. Mọi luồng truyền tải dữ liệu qua HTTPS và bảo vệ tầng API bằng chuẩn Stateless JWT Token.", bold_prefix="1. Bảo mật: ")
    add_bullet("Tốc độ phản hồi giao dịch POS < 300ms. Chịu tải đồng thời tối thiểu 100 phiên giao dịch tại quầy và thiết bị cầm tay trong giờ cao điểm.", bold_prefix="2. Hiệu năng: ")
    add_bullet("Thiết kế theo chuẩn Responsive UI tối ưu trên màn hình cảm ứng POS quầy thu ngân, Máy tính bảng (iPad/Tablet của nhân viên phục vụ) và Điện thoại thông minh.", bold_prefix="3. Giao diện & Trải nghiệm: ")

    # ==========================================
    # PHẦN II: PHA PHÂN TÍCH HỆ THỐNG
    # ==========================================
    doc.add_page_break()
    add_h1("PHẦN II: PHA PHÂN TÍCH HỆ THỐNG (SYSTEM ANALYSIS PHASE)")

    add_h2("2.1. Trích xuất các lớp thực thể (Entity Classes) & Quan hệ")
    add_p("Qua quá trình phân tích ngữ nghĩa nghiệp vụ của hệ thống Quản lý Quán Cà phê, các lớp thực thể cốt lõi được định nghĩa bao gồm:")
    add_bullet("id, username, password, role (ADMIN, STAFF, CUSTOMER).", bold_prefix="Account: ")
    add_bullet("id, full_name, phone_number, identity_card, date_of_birth, position, hire_date, salary, account_id, is_active.", bold_prefix="Employee: ")
    add_bullet("id, name, status (AVAILABLE, OCCUPIED, DELETED).", bold_prefix="CafeTable: ")
    add_bullet("id, name, description.", bold_prefix="Category: ")
    add_bullet("id, name, price, image_url, category_id, is_available.", bold_prefix="Product: ")
    add_bullet("id, table_id, account_id, total_amount, status (PENDING, PAID, CANCELLED), order_type, payment_method, created_at.", bold_prefix="Orders: ")
    add_bullet("id, order_id, product_id, quantity, price, note.", bold_prefix="OrderDetail: ")

    add_p("Mối quan hệ giữa các lớp thực thể:")
    add_bullet("Account (1) liên kết 1-1 với Employee (1) thông qua account_id.", bold_prefix="Quan hệ 1 - 1: ")
    add_bullet("Category (1) chứa nhiều Product (n); CafeTable (1) liên kết với nhiều Orders (n); Account (1) lập nhiều Orders (n); Orders (1) chứa nhiều OrderDetail (n); Product (1) xuất hiện trong nhiều OrderDetail (n).", bold_prefix="Quan hệ 1 - n: ")

    add_h2("2.2. Biểu đồ Trạng thái (State Machine Diagram)")
    add_bullet("AVAILABLE (Bàn trống) -> Khi khách vào / tạo đơn PENDING -> OCCUPIED (Đang có khách) -> Khi thanh toán hoàn tất (PAID) & dọn bàn -> Trở về AVAILABLE. Nếu Quản lý xóa bàn và bàn không có đơn chờ -> DELETED (Xóa mềm).", bold_prefix="Trạng thái Sơ đồ bàn (CafeTable): ")
    add_bullet("Tạo mới order -> PENDING (Chờ thanh toán / Đang phục vụ) -> Thu ngân chốt thanh toán -> PAID (Đã thanh toán) hoặc CANCELLED (Hủy đơn).", bold_prefix="Trạng thái Hóa đơn bán hàng (Orders): ")

    add_h2("2.3. Biểu đồ Tuần tự (Sequence Diagrams)")
    add_h3("2.3.1. Biểu đồ Tuần tự: Tạo đơn hàng tại bàn (POS Order Creation)")
    add_p("Trình tự tương tác giữa Thu ngân, Giao diện POS, OrderController, OrderService, CafeTableRepo và OrderRepo trong quá trình tạo đơn hàng tại bàn:")
    add_fig("f1_image8.png", "Hình 2.1: Biểu đồ Tuần tự (Sequence Diagram) - Tạo đơn hàng tại bàn")

    add_h3("2.3.2. Biểu đồ Tuần tự: Thanh toán hóa đơn (Checkout Process)")
    add_p("Trình tự tương tác xử lý chốt tổng tiền, cập nhật trạng thái hóa đơn sang PAID và tự động giải phóng trạng thái bàn về AVAILABLE:")
    add_fig("f1_image9.png", "Hình 2.2: Biểu đồ Tuần tự (Sequence Diagram) - Thanh toán hóa đơn POS")

    # ==========================================
    # PHẦN III: PHA THIẾT KẾ HỆ THỐNG
    # ==========================================
    doc.add_page_break()
    add_h1("PHẦN III: PHA THIẾT KẾ HỆ THỐNG (SYSTEM DESIGN PHASE)")

    add_h2("3.1. Thiết kế Cơ sở Dữ liệu Quan hệ (Relational Database Design)")
    add_h3("3.1.1. Sơ đồ Cấu trúc CSDL chuẩn 3NF (Database ERD Diagram)")
    add_p("Lược đồ CSDL quan hệ đạt chuẩn dạng chuẩn 3NF với 7 bảng cốt lõi liên kết thông qua các ràng buộc toàn vẹn khóa chính và khóa ngoại:")
    add_fig("f1_image10.png", "Hình 3.1: Sơ đồ Cấu trúc CSDL ERD (Database ERD Diagram)")

    add_h3("3.1.2. Bảng đặc tả chi tiết các bảng vật lý trong CSDL Microsoft SQL Server")

    add_p("1. Bảng Account (Tài khoản người dùng)", bold_prefix="")
    tbl_acc = doc.add_table(rows=5, cols=4)
    acc_rows = [
        ["Tên trường", "Kiểu dữ liệu", "Ràng buộc (Constraint)", "Diễn giải ý nghĩa"],
        ["id", "INT", "PK, Identity(1,1)", "Mã tài khoản tự tăng"],
        ["username", "VARCHAR(50)", "UNIQUE, NOT NULL", "Tên đăng nhập hệ thống"],
        ["password", "VARCHAR(255)", "NOT NULL", "Mật khẩu mã hóa BCrypt"],
        ["role", "VARCHAR(20)", "NOT NULL", "Vai trò: ADMIN / STAFF / CUSTOMER"]
    ]
    for r_idx, row in enumerate(acc_rows):
        for c_idx, val in enumerate(row):
            tbl_acc.cell(r_idx, c_idx).text = val
    style_table(tbl_acc, [1.4, 1.4, 1.8, 2.0])

    add_p("2. Bảng Employee (Hồ sơ nhân sự)", bold_prefix="")
    tbl_emp = doc.add_table(rows=11, cols=4)
    emp_rows = [
        ["Tên trường", "Kiểu dữ liệu", "Ràng buộc (Constraint)", "Diễn giải ý nghĩa"],
        ["id", "INT", "PK, Identity(1,1)", "Mã nhân viên"],
        ["full_name", "NVARCHAR(100)", "NOT NULL", "Họ và tên nhân viên"],
        ["phone_number", "VARCHAR(20)", "NULL", "Số điện thoại liên hệ"],
        ["identity_card", "VARCHAR(20)", "UNIQUE, NULL", "Số CCCD / CMND định danh"],
        ["date_of_birth", "DATE", "NULL", "Ngày sinh nhân viên"],
        ["position", "NVARCHAR(50)", "NULL", "Chức danh: Quản lý, Thu ngân, Phục vụ..."],
        ["hire_date", "DATE", "DEFAULT GETDATE()", "Ngày vào làm việc"],
        ["salary", "DECIMAL(18,2)", "DEFAULT 0", "Mức lương cơ bản"],
        ["account_id", "INT", "UNIQUE, FK -> Account(id)", "Tài khoản đăng nhập liên kết"],
        ["is_active", "BIT", "DEFAULT 1", "Trạng thái làm việc (1: Đang làm, 0: Đã nghỉ)"]
    ]
    for r_idx, row in enumerate(emp_rows):
        for c_idx, val in enumerate(row):
            tbl_emp.cell(r_idx, c_idx).text = val
    style_table(tbl_emp, [1.4, 1.4, 1.8, 2.0])

    add_p("3. Bảng CafeTable (Sơ đồ bàn quán cà phê)", bold_prefix="")
    tbl_tab = doc.add_table(rows=4, cols=4)
    tab_rows = [
        ["Tên trường", "Kiểu dữ liệu", "Ràng buộc (Constraint)", "Diễn giải ý nghĩa"],
        ["id", "INT", "PK, Identity(1,1)", "Mã bàn"],
        ["name", "NVARCHAR(50)", "NOT NULL", "Tên bàn (VD: Bàn 1, Bàn 2, Bàn VIP)"],
        ["status", "VARCHAR(20)", "DEFAULT 'AVAILABLE'", "Trạng thái: AVAILABLE / OCCUPIED / DELETED"]
    ]
    for r_idx, row in enumerate(tab_rows):
        for c_idx, val in enumerate(row):
            tbl_tab.cell(r_idx, c_idx).text = val
    style_table(tbl_tab, [1.4, 1.4, 1.8, 2.0])

    add_p("4. Bảng Category (Danh mục sản phẩm)", bold_prefix="")
    tbl_cat = doc.add_table(rows=4, cols=4)
    cat_rows = [
        ["Tên trường", "Kiểu dữ liệu", "Ràng buộc (Constraint)", "Diễn giải ý nghĩa"],
        ["id", "INT", "PK, Identity(1,1)", "Mã danh mục"],
        ["name", "NVARCHAR(100)", "NOT NULL", "Tên danh mục (Cà phê, Trà, Bánh ngọt...)"],
        ["description", "NVARCHAR(255)", "NULL", "Mô tả chi tiết danh mục"]
    ]
    for r_idx, row in enumerate(cat_rows):
        for c_idx, val in enumerate(row):
            tbl_cat.cell(r_idx, c_idx).text = val
    style_table(tbl_cat, [1.4, 1.4, 1.8, 2.0])

    add_p("5. Bảng Product (Thực đơn món đồ uống & Bánh)", bold_prefix="")
    tbl_prod = doc.add_table(rows=7, cols=4)
    prod_rows = [
        ["Tên trường", "Kiểu dữ liệu", "Ràng buộc (Constraint)", "Diễn giải ý nghĩa"],
        ["id", "INT", "PK, Identity(1,1)", "Mã đồ uống / món"],
        ["name", "NVARCHAR(100)", "NOT NULL", "Tên sản phẩm món đồ uống"],
        ["price", "DECIMAL(18,2)", "NOT NULL", "Đơn giá niêm yết (VND)"],
        ["image_url", "VARCHAR(255)", "NULL", "Tên tệp hình ảnh đại diện"],
        ["category_id", "INT", "FK -> Category(id)", "Thuộc danh mục món nào"],
        ["is_available", "BIT", "DEFAULT 1", "Trạng thái phục vụ (1: Còn hàng, 0: Hết hàng)"]
    ]
    for r_idx, row in enumerate(prod_rows):
        for c_idx, val in enumerate(row):
            tbl_prod.cell(r_idx, c_idx).text = val
    style_table(tbl_prod, [1.4, 1.4, 1.8, 2.0])

    add_p("6. Bảng Orders (Hóa đơn bán hàng)", bold_prefix="")
    tbl_ord = doc.add_table(rows=9, cols=4)
    ord_rows = [
        ["Tên trường", "Kiểu dữ liệu", "Ràng buộc (Constraint)", "Diễn giải ý nghĩa"],
        ["id", "INT", "PK, Identity(1,1)", "Mã số hóa đơn"],
        ["table_id", "INT", "NULL, FK -> CafeTable(id)", "Bàn phục vụ (NULL nếu mang về / online)"],
        ["account_id", "INT", "FK -> Account(id)", "Tài khoản thu ngân / khách hàng lập đơn"],
        ["total_amount", "DECIMAL(18,2)", "DEFAULT 0", "Tổng tiền thanh toán"],
        ["status", "VARCHAR(20)", "DEFAULT 'PENDING'", "Trạng thái: PENDING / PAID / CANCELLED"],
        ["order_type", "VARCHAR(20)", "DEFAULT 'DINE_IN'", "Loại đơn: DINE_IN / TAKEAWAY / ONLINE"],
        ["payment_method", "VARCHAR(20)", "DEFAULT 'CASH'", "Phương thức: CASH / BANKING"],
        ["created_at", "DATETIME", "DEFAULT GETDATE()", "Thời gian khởi tạo hóa đơn"]
    ]
    for r_idx, row in enumerate(ord_rows):
        for c_idx, val in enumerate(row):
            tbl_ord.cell(r_idx, c_idx).text = val
    style_table(tbl_ord, [1.4, 1.4, 1.8, 2.0])

    add_p("7. Bảng OrderDetail (Chi tiết hóa đơn)", bold_prefix="")
    tbl_od = doc.add_table(rows=7, cols=4)
    od_rows = [
        ["Tên trường", "Kiểu dữ liệu", "Ràng buộc (Constraint)", "Diễn giải ý nghĩa"],
        ["id", "INT", "PK, Identity(1,1)", "Mã chi tiết hóa đơn"],
        ["order_id", "INT", "FK -> Orders(id)", "Thuộc hóa đơn nào"],
        ["product_id", "INT", "FK -> Product(id)", "Món đồ uống được gọi"],
        ["quantity", "INT", "NOT NULL, CHECK (quantity > 0)", "Số lượng gọi món"],
        ["price", "DECIMAL(18,2)", "NOT NULL", "Đơn giá tại thời điểm bán"],
        ["note", "NVARCHAR(255)", "NULL", "Ghi chú thêm (ít đường, ít đá...)"]
    ]
    for r_idx, row in enumerate(od_rows):
        for c_idx, val in enumerate(row):
            tbl_od.cell(r_idx, c_idx).text = val
    style_table(tbl_od, [1.4, 1.4, 1.8, 2.0])

    add_h2("3.2. Thiết kế Kiến trúc Hệ thống (System Architecture Design)")
    add_h3("3.2.1. Biểu đồ Kiến trúc Thành phần 3 Tầng (Component Diagram)")
    add_p("Hệ thống tuân thủ kiến trúc phân tầng dịch vụ phân định ranh giới rõ ràng:")
    add_bullet("Next.js 15 App Router, React 19, Tailwind CSS, TanStack Query v5 Cache, Axios Client Interceptor.", bold_prefix="1. Tầng Trình diễn (Presentation Layer): ")
    add_bullet("Spring Boot 3, Spring Security JWT Filter, REST Controllers, Service Layer, JPA Hibernate Repositories.", bold_prefix="2. Tầng Nghiệp vụ (Business Logic Layer): ")
    add_bullet("Microsoft SQL Server 2022 lưu trữ bảng và Stored Procedures; kết nối Google OAuth2 và Gemini 2.5 Flash API.", bold_prefix="3. Tầng Dữ liệu & Dịch vụ ngoài: ")
    add_fig("f1_image11.png", "Hình 3.2: Biểu đồ Kiến trúc Thành phần 3 Tầng (Component Diagram)")

    add_h3("3.2.2. Biểu đồ Triển khai Hệ thống (Deployment Diagram)")
    add_p("Mô hình triển khai phân tán trên môi trường Cloud hiện đại:")
    add_fig("f1_image12.png", "Hình 3.3: Biểu đồ Triển khai Hệ thống (Deployment Diagram)")

    add_h2("3.3. Thiết kế Giao diện Người dùng (UI/UX Design)")
    add_p("Toàn bộ các màn hình giao diện thực tế của ứng dụng Coffee Chill đã được sắp xếp chính xác và đồng bộ theo đúng nội dung phân mục chức năng:")

    add_h3("3.3.1. Giao diện Đăng nhập hệ thống & Xác thực Google OAuth2")
    add_p("Màn hình đăng nhập trang trọng với tùy chọn đăng nhập truyền thống bằng tài khoản nhân viên / quản lý hoặc xác thực đăng nhập nhanh một chạm qua Google OAuth2:")
    add_fig("f1_image15.jpg", "Hình 3.4: Giao diện Đăng nhập hệ thống & Xác thực Google OAuth2")

    add_h3("3.3.2. Giao diện Quản lý Sơ đồ bàn theo thời gian thực")
    add_p("Màn hình quản lý không gian quán hiển thị trực quan trạng thái từng bàn (BÀN TRỐNG màu xanh hoặc ĐANG PHỤC VỤ), hỗ trợ nút làm mới và tạo bàn mới nhanh chóng:")
    add_fig("f1_image14.png", "Hình 3.5: Giao diện Quản lý Sơ đồ bàn theo thời gian thực")

    add_h3("3.3.3. Giao diện Bán hàng tại quầy (POS) & Thực đơn gọi món")
    add_p("Màn hình nghiệp vụ chính của thu ngân: Bên trái là lưới thực đơn món đồ uống theo danh mục (Cà phê pha máy, Trà trái cây, Bánh ngọt); bên phải là giỏ hàng đơn hiện tại, chọn bàn trống và nút xác nhận đặt hàng:")
    add_fig("f1_image13.jpg", "Hình 3.6: Giao diện Bán hàng tại quầy (POS) & Thực đơn gọi món")

    add_h3("3.3.4. Giao diện Trợ lý Trí tuệ Nhân tạo Kinh doanh (Gemini AI Assistant)")
    add_p("Màn hình tích hợp mô hình ngôn ngữ lớn Google Gemini AI hỗ trợ quản lý phân tích dữ liệu bán hàng, đưa ra khuyến nghị tồn kho và chiến lược kinh doanh:")
    add_fig("f1_image16.png", "Hình 3.7: Giao diện Trợ lý ảo AI Kinh doanh tích hợp Google Gemini")

    # ==========================================
    # PHẦN IV: LẬP TRÌNH, TRIỂN KHAI & KẾT LUẬN
    # ==========================================
    doc.add_page_break()
    add_h1("PHẦN IV: LẬP TRÌNH, TRIỂN KHAI & KẾT LUẬN")

    add_h2("4.1. Môi trường công nghệ & Cấu trúc thư mục dự án")
    add_bullet("Next.js 15 (React 19), Tailwind CSS, Shadcn UI, Lucide Icons, Axios, TanStack Query.", bold_prefix="Frontend: ")
    add_bullet("Java 17/21 OpenJDK, Spring Boot 3.x, Spring Data JPA, Spring Security, jjwt, Lombok.", bold_prefix="Backend: ")
    add_bullet("Microsoft SQL Server 2022 (Tables, Foreign Keys, Views, Stored Procedures).", bold_prefix="Database: ")
    add_bullet("Google Gemini 2.5 Flash API (qua Next.js Route Handler /api/chat).", bold_prefix="Artificial Intelligence: ")

    add_h2("4.2. Mã nguồn Stored Procedures SQL tiêu biểu")
    add_h3("Thủ tục 1: Chốt ca và Thanh toán hóa đơn POS (sp_CheckoutOrder)")
    add_code_block("""CREATE OR ALTER PROCEDURE sp_CheckoutOrder
    @OrderId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- 1. Tính tổng tiền từ chi tiết hóa đơn
    DECLARE @Total DECIMAL(18,2);
    SELECT @Total = ISNULL(SUM(quantity * price), 0)
    FROM OrderDetail
    WHERE order_id = @OrderId;

    -- 2. Cập nhật hóa đơn sang trạng thái PAID
    UPDATE Orders
    SET total_amount = @Total, status = 'PAID'
    WHERE id = @OrderId;

    -- 3. Tự động giải phóng bàn về AVAILABLE
    UPDATE CafeTable
    SET status = 'AVAILABLE'
    WHERE id = (SELECT table_id FROM Orders WHERE id = @OrderId);

    SELECT 1 AS Status, N'Thanh toán thành công' AS Message;
END;
GO""")

    add_h3("Thủ tục 2: Thống kê doanh thu theo Sản phẩm trong khoảng thời gian (sp_ThongKeDoanhThuMon)")
    add_code_block("""CREATE OR ALTER PROCEDURE sp_ThongKeDoanhThuMon
    @TuNgay DATE,
    @DenNgay DATE
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        p.id AS MaMon,
        p.name AS TenMon,
        c.name AS DanhMuc,
        ISNULL(SUM(od.quantity), 0) AS TongSoLuongBan,
        ISNULL(SUM(od.quantity * od.price), 0) AS TongDoanhThu
    FROM Product p
    INNER JOIN Category c ON p.category_id = c.id
    LEFT JOIN OrderDetail od ON p.id = od.product_id
    LEFT JOIN Orders o ON od.order_id = o.id 
        AND o.status = 'PAID' 
        AND CAST(o.created_at AS DATE) BETWEEN @TuNgay AND @DenNgay
    GROUP BY p.id, p.name, c.name
    ORDER BY TongDoanhThu DESC;
END;
GO""")

    add_h2("4.3. Bảng kịch bản kiểm thử hệ thống (Test Cases)")
    tbl_tc = doc.add_table(rows=7, cols=5)
    tc_data = [
        ["Mã TC", "Tên ca kiểm thử", "Dữ liệu đầu vào", "Kết quả mong đợi", "Trạng thái"],
        ["TC-01", "Đăng nhập hệ thống", "admin / Admin109205@", "Xác thực thành công, cấp JWT Token", "PASSED"],
        ["TC-02", "Đăng nhập Google OAuth2", "Tài khoản Gmail hợp lệ", "Đăng nhập thành công, điều hướng trang chủ", "PASSED"],
        ["TC-03", "Thêm mới bàn", "Tên: 'Bàn VIP 4'", "Bàn lưu CSDL, hiển thị thẻ bàn AVAILABLE", "PASSED"],
        ["TC-04", "Tạo đơn POS tại bàn", "Chọn Bàn 1 + 2 Cà phê Đen", "Lưu hóa đơn PENDING, Bàn 1 đổi OCCUPIED", "PASSED"],
        ["TC-05", "Thanh toán hóa đơn POS", "Bấm 'Thanh toán' tiền mặt", "Hóa đơn chuyển PAID, Bàn 1 về AVAILABLE", "PASSED"],
        ["TC-06", "Hỏi đáp Trợ lý AI", "Hỏi phân tích doanh thu", "Gemini AI trả lời phân tích chuẩn xác", "PASSED"]
    ]
    for r_idx, row in enumerate(tc_data):
        for c_idx, val in enumerate(row):
            tbl_tc.cell(r_idx, c_idx).text = val
    style_table(tbl_tc, [0.8, 1.6, 1.8, 1.8, 0.8])

    add_h2("4.4. Đánh giá kết quả & Hướng phát triển")
    add_h3("4.4.1. Đánh giá kết quả đạt được")
    add_bullet("Hoàn thiện trọn vẹn toàn bộ hồ sơ phân tích thiết kế hệ thống thông tin theo phương pháp OOAD từ pha đặc tả, phân tích, thiết kế đến cài đặt.")
    add_bullet("Đồng bộ thống nhất giữa mô hình lý thuyết học thuật với hệ sinh thái công nghệ thực tế đang vận hành của dự án (Next.js 15, Spring Boot 3, SQL Server 2022).")
    add_bullet("Tích hợp thành công Trợ lý Trí tuệ Nhân tạo Google Gemini 2.5 Flash, tạo đột phá trong công tác hỗ trợ phân tích và ra quyết định quản trị kinh doanh.")

    add_h3("4.4.2. Hướng phát triển trong tương lai")
    add_bullet("Tích hợp cổng thanh toán trực tuyến tự động qua quét mã VietQR động, cổng thanh toán VNPAY và ví điện tử MoMo.")
    add_bullet("Mở rộng phân hệ đặt bàn trước từ xa (Table Reservation) cho khách hàng thông qua Mobile App.")
    add_bullet("Xây dựng mô hình gợi ý đồ uống thông minh (Personalized Recommendation System) dựa trên lịch sử tiêu dùng của khách hàng thân thiết.")

    # Save document
    out_file = r'd:\PTTKHTTT\docs\BAO_CAO_BTL_PTTKHTTT_DO_NANG_HIEU_B23DVCN058.docx'
    doc.save(out_file)
    print(f"Report saved successfully to: {out_file}")
    print(f"File size: {os.path.getsize(out_file)} bytes")

if __name__ == '__main__':
    create_full_report()
