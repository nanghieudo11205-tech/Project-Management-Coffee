"use client";
import { CheckCircle, Coffee, Printer, X } from "lucide-react";
import { useRef } from "react";

export interface InvoiceItem {
  name: string;
  quantity: number;
  price: number;
  note?: string;
}

export interface InvoiceData {
  orderId: number | string;
  tableName?: string | null;
  orderType?: string; // DINE_IN hoặc TAKEAWAY
  cashierName?: string | null;
  createdAt?: string | Date;
  items: InvoiceItem[];
  totalAmount: number;
  paymentMethod?: string; // CASH hoặc BANKING
  customerPaid?: number; // Tiền khách đưa (nếu có)
  change?: number; // Tiền thừa (nếu có)
}

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: InvoiceData | null;
}

export function InvoiceModal({ isOpen, onClose, invoice }: InvoiceModalProps) {
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = invoice.createdAt
    ? new Date(invoice.createdAt).toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : new Date().toLocaleString("vi-VN");

  const isTakeaway = invoice.orderType === "TAKEAWAY" || !invoice.tableName;
  const paymentMethodLabel =
    invoice.paymentMethod === "BANKING" ? "Chuyển khoản (VietQR)" : "Tiền mặt";

  return (
    <>
      {/* CSS đặc biệt để chỉ in vùng #printable-invoice khi gọi window.print() */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-invoice,
          #printable-invoice * {
            visibility: visible !important;
          }
          #printable-invoice {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 80mm !important;
            margin: 0 !important;
            padding: 10px !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Backdrop */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header modal */}
          <div className="px-6 py-4 bg-gradient-to-r from-amber-600 to-amber-700 text-white flex items-center justify-between no-print">
            <div className="flex items-center gap-2">
              <Printer className="w-5 h-5" />
              <h3 className="font-bold text-lg">Phiếu thanh toán</h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-white/20 transition-colors text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Vùng Hóa đơn (Cuộn được nếu dài) */}
          <div className="p-6 overflow-y-auto flex-1 bg-slate-50 flex justify-center">
            <div
              id="printable-invoice"
              ref={printAreaRef}
              className="bg-white p-6 rounded-xl border border-dashed border-slate-300 w-full text-slate-800 font-mono text-sm shadow-sm"
              style={{ maxWidth: "340px" }}
            >
              {/* Logo & Header quán */}
              <div className="text-center pb-4 border-b border-dashed border-slate-300">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold">
                    <Coffee className="w-4 h-4" />
                  </div>
                  <h1 className="font-extrabold text-lg tracking-wider text-slate-900">
                    QLCAFE COFFEE
                  </h1>
                </div>
                <p className="text-xs text-slate-500">Đ/C: 123 Đường Cà Phê, Quận 1, TP.HCM</p>
                <p className="text-xs text-slate-500">Hotline: 0901.234.567</p>
                <h2 className="font-bold text-base mt-2 text-slate-900 uppercase">
                  HÓA ĐƠN THANH TOÁN
                </h2>
              </div>

              {/* Thông tin hóa đơn */}
              <div className="py-3 text-xs space-y-1 border-b border-dashed border-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">Mã đơn:</span>
                  <span className="font-bold">#{invoice.orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Khu vực / Bàn:</span>
                  <span className="font-bold">
                    {isTakeaway ? "Mang về (Takeaway)" : invoice.tableName}
                  </span>
                </div>
                {invoice.cashierName && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Thu ngân:</span>
                    <span>{invoice.cashierName}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Thời gian:</span>
                  <span>{formattedDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Hình thức:</span>
                  <span className="font-medium text-amber-700">{paymentMethodLabel}</span>
                </div>
              </div>

              {/* Danh sách món */}
              <div className="py-3 border-b border-dashed border-slate-300">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="text-left pb-1 font-semibold">Tên món</th>
                      <th className="text-center pb-1 font-semibold">SL</th>
                      <th className="text-right pb-1 font-semibold">Đ.Giá</th>
                      <th className="text-right pb-1 font-semibold">T.Tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoice.items.map((item, idx) => (
                      <tr key={idx} className="align-top">
                        <td className="py-1.5 text-left pr-1">
                          <div className="font-medium text-slate-900">{item.name}</div>
                          {item.note && (
                            <div className="text-[10px] text-amber-600 italic">* {item.note}</div>
                          )}
                        </td>
                        <td className="py-1.5 text-center font-bold px-1">{item.quantity}</td>
                        <td className="py-1.5 text-right whitespace-nowrap text-slate-600">
                          {item.price.toLocaleString("vi-VN")}
                        </td>
                        <td className="py-1.5 text-right font-semibold whitespace-nowrap text-slate-900">
                          {(item.price * item.quantity).toLocaleString("vi-VN")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Tổng tiền & thanh toán */}
              <div className="py-3 space-y-1.5 text-xs border-b border-dashed border-slate-300">
                <div className="flex justify-between text-base font-extrabold text-slate-900">
                  <span>TỔNG TIỀN:</span>
                  <span className="text-amber-700">
                    {invoice.totalAmount.toLocaleString("vi-VN")} đ
                  </span>
                </div>
                {invoice.customerPaid != null && invoice.customerPaid > 0 && (
                  <>
                    <div className="flex justify-between text-slate-600">
                      <span>Tiền khách đưa:</span>
                      <span>{invoice.customerPaid.toLocaleString("vi-VN")} đ</span>
                    </div>
                    <div className="flex justify-between text-slate-600 font-semibold">
                      <span>Tiền thừa trả khách:</span>
                      <span>{(invoice.change || 0).toLocaleString("vi-VN")} đ</span>
                    </div>
                  </>
                )}
              </div>

              {/* Lời cảm ơn và Footer */}
              <div className="text-center pt-4 text-xs text-slate-500 space-y-1">
                <p className="font-bold text-slate-700">Cảm ơn quý khách và hẹn gặp lại!</p>
                <p className="text-[10px]">Wifi: QLCafe_Free - Pass: 88888888</p>
                <div className="flex items-center justify-center gap-1 text-[10px] text-emerald-600 font-medium pt-1">
                  <CheckCircle className="w-3 h-3" /> Đã hoàn tất thanh toán
                </div>
              </div>
            </div>
          </div>

          {/* Footer nút hành động */}
          <div className="p-4 bg-white border-t border-slate-200 flex gap-3 no-print">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
            >
              <Printer className="w-4 h-4" />
              In hóa đơn
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
