"use client";
import { ArrowRight, Banknote, QrCode, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number;
  tableName?: string | null;
  totalAmount: number;
  onConfirmCheckout: (
    paymentMethod: "CASH" | "BANKING",
    customerPaid?: number,
    change?: number,
  ) => Promise<void>;
}

export function CheckoutModal({
  isOpen,
  onClose,
  orderId,
  tableName,
  totalAmount,
  onConfirmCheckout,
}: CheckoutModalProps) {
  const [method, setMethod] = useState<"CASH" | "BANKING">("CASH");
  const [customerPaid, setCustomerPaid] = useState<number>(totalAmount);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const change = Math.max(0, customerPaid - totalAmount);
  const isEnoughMoney = method === "BANKING" || customerPaid >= totalAmount;

  const quickAmounts = [
    totalAmount,
    Math.ceil(totalAmount / 50000) * 50000,
    Math.ceil(totalAmount / 100000) * 100000,
    500000,
  ].filter((v, idx, arr) => v >= totalAmount && arr.indexOf(v) === idx);

  // VietQR link (Demo MB Bank 970422)
  const vietQrUrl = `https://img.vietqr.io/image/970422-0901234567-compact2.png?amount=${totalAmount}&addInfo=Don%20${orderId}%20${encodeURIComponent(tableName || "MangVe")}&accountName=QUAN%20CAFE%20DEMO`;

  const handleConfirm = async () => {
    if (!isEnoughMoney) return;
    try {
      setLoading(true);
      await onConfirmCheckout(method, customerPaid, change);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg">Thanh toán đơn hàng #{orderId}</h3>
            <p className="text-xs text-slate-400">
              {tableName ? `Bàn: ${tableName}` : "Đơn mang về (Takeaway)"} • Tổng tiền:{" "}
              <span className="text-amber-400 font-bold text-sm">
                {totalAmount.toLocaleString("vi-VN")} đ
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 transition-colors text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nội dung */}
        <div className="p-6 space-y-6">
          {/* Lựa chọn phương thức */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Chọn phương thức thanh toán
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMethod("CASH")}
                className={`flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left ${
                  method === "CASH"
                    ? "border-amber-600 bg-amber-50 text-amber-950 font-bold shadow-sm"
                    : "border-slate-200 hover:border-slate-300 text-slate-700"
                }`}
              >
                <div
                  className={`p-2 rounded-lg ${
                    method === "CASH" ? "bg-amber-600 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm">Tiền mặt</div>
                  <div className="text-xs text-slate-500 font-normal">Thanh toán tại quầy</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMethod("BANKING")}
                className={`flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left ${
                  method === "BANKING"
                    ? "border-emerald-600 bg-emerald-50 text-emerald-950 font-bold shadow-sm"
                    : "border-slate-200 hover:border-slate-300 text-slate-700"
                }`}
              >
                <div
                  className={`p-2 rounded-lg ${
                    method === "BANKING"
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm">Chuyển khoản</div>
                  <div className="text-xs text-slate-500 font-normal">Quét mã VietQR</div>
                </div>
              </button>
            </div>
          </div>

          {/* Form theo phương thức */}
          {method === "CASH" ? (
            <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tiền khách đưa (VNĐ)
                </label>
                <input
                  type="number"
                  min={totalAmount}
                  step={1000}
                  value={customerPaid || ""}
                  onChange={(e) => setCustomerPaid(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold text-lg text-slate-900"
                />
              </div>

              {/* Gợi ý số tiền nhanh */}
              <div className="flex flex-wrap gap-2">
                {quickAmounts.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setCustomerPaid(amt)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                      customerPaid === amt
                        ? "bg-amber-600 text-white"
                        : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {amt.toLocaleString("vi-VN")} đ
                  </button>
                ))}
              </div>

              {/* Tiền thừa */}
              <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm">
                <span className="text-slate-600">Tiền thừa trả khách:</span>
                <span
                  className={`font-extrabold text-base ${
                    customerPaid < totalAmount ? "text-red-600" : "text-emerald-700"
                  }`}
                >
                  {customerPaid < totalAmount
                    ? `Thiếu ${(totalAmount - customerPaid).toLocaleString("vi-VN")} đ`
                    : `${change.toLocaleString("vi-VN")} đ`}
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center space-y-3">
              <p className="text-xs text-slate-600">
                Khách dùng app ngân hàng bất kỳ để quét mã VietQR tự động nhập số tiền & nội dung:
              </p>
              <div className="flex justify-center">
                <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-200">
                  <Image
                    src={vietQrUrl}
                    alt="Mã VietQR"
                    width={200}
                    height={200}
                    unoptimized
                    className="w-48 h-auto object-contain rounded-lg"
                  />
                </div>
              </div>
              <div className="text-xs text-slate-500 font-mono">
                Số tiền:{" "}
                <strong className="text-slate-900">{totalAmount.toLocaleString("vi-VN")} đ</strong>{" "}
                • Nội dung: <strong className="text-slate-900">Don {orderId}</strong>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-white transition-colors"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading || !isEnoughMoney}
            className="flex-1 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 text-white font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
          >
            {loading ? "Đang xử lý..." : "Xác nhận & Hoàn tất"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
