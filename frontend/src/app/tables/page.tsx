"use client";
export const dynamic = "force-dynamic";

import {
  ArrowRightLeft,
  CheckCircle,
  Coffee,
  MoreVertical,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { CheckoutModal } from "@/components/ui/CheckoutModal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { type InvoiceData, InvoiceModal } from "@/components/ui/InvoiceModal";
import { DataUpdatedToast, MutatingOverlay, useSmartOverlay } from "@/components/ui/LoadingOverlay";
import { SwitchTableModal } from "@/components/ui/SwitchTableModal";
import { useTablesData } from "@/hooks/useTablesData";
import axiosInstance from "@/lib/axios";

export default function TablesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tableName, setTableName] = useState("");
  const [saving, setSaving] = useState(false);

  // States for Edit/Delete actions
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const [editingTable, setEditingTable] = useState<{ id: number; name: string } | null>(null);
  const [editTableName, setEditTableName] = useState("");

  // Custom success & error popups
  const [errorModal, setErrorModal] = useState<{ isOpen: boolean; message: string }>({
    isOpen: false,
    message: "",
  });

  // Custom ConfirmModal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: React.ReactNode;
    type?: "danger" | "warning" | "success" | "info";
    confirmText?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "warning",
    confirmText: "Xác nhận",
    onConfirm: () => {},
  });

  // Custom checkout success popup
  const [checkoutSuccessModal, setCheckoutSuccessModal] = useState<{
    isOpen: boolean;
    message: string;
  }>({
    isOpen: false,
    message: "",
  });

  // Modal Thanh toán (Tiền mặt / Chuyển khoản)
  const [checkoutModal, setCheckoutModal] = useState<{
    isOpen: boolean;
    orderId: number;
    tableName: string;
    totalAmount: number;
  }>({
    isOpen: false,
    orderId: 0,
    tableName: "",
    totalAmount: 0,
  });

  // Modal In Hóa Đơn
  const [invoiceModal, setInvoiceModal] = useState<{
    isOpen: boolean;
    invoice: InvoiceData | null;
  }>({
    isOpen: false,
    invoice: null,
  });

  // Modal Chuyển Bàn Nhanh
  const [switchTableModal, setSwitchTableModal] = useState<{
    isOpen: boolean;
    currentTable: { id: number; name: string; status: string } | null;
  }>({
    isOpen: false,
    currentTable: null,
  });

  // Toast message
  const [toastMessage, setToastMessage] = useState("Cập nhật dữ liệu thành công ✓");

  // SWR: Dữ liệu cache + overlay/toast khi thay đổi
  const { tables, orders, isLoading, isValidating, mutate, mutateTables } = useTablesData();
  const { showOverlay, showToast, startMutation, endMutation } = useSmartOverlay(
    tables,
    isValidating,
    isLoading,
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = () => {
      setOpenDropdownId(null);
    };
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setToastMessage("Cập nhật dữ liệu thành công ✓");
      setSaving(true);
      startMutation();
      await axiosInstance.post("/tables", { name: tableName, status: "AVAILABLE" });
      setIsModalOpen(false);
      setTableName("");
      await mutateTables();
      endMutation();
    } catch (err) {
      console.error(err);
      endMutation();
    } finally {
      setSaving(false);
    }
  };

  const handleCheckout = (tableId: number) => {
    const order = orders.find((o) => o.cafeTable?.id === tableId);
    if (!order) return alert("Không tìm thấy đơn hàng cho bàn này");

    setCheckoutModal({
      isOpen: true,
      orderId: order.id,
      tableName: order.cafeTable?.name || "",
      totalAmount: order.totalAmount,
    });
  };

  const handleConfirmCheckout = async (
    paymentMethod: "CASH" | "BANKING",
    customerPaid?: number,
    change?: number,
  ) => {
    try {
      startMutation();
      await axiosInstance.put(
        `/orders/${checkoutModal.orderId}/checkout?paymentMethod=${paymentMethod}`,
      );

      // Lấy chi tiết đơn để in bill
      const res = await axiosInstance.get(`/orders/${checkoutModal.orderId}`);
      const orderDetails = res.data;

      const invoice: InvoiceData = {
        orderId: checkoutModal.orderId,
        tableName: checkoutModal.tableName,
        orderType: orderDetails.orderType || "DINE_IN",
        cashierName: orderDetails.account?.username,
        createdAt: orderDetails.createdAt,
        items: (orderDetails.orderDetails || []).map(
          (d: { product?: { name?: string }; quantity: number; price: number; note?: string }) => ({
            name: d.product?.name || "Món",
            quantity: d.quantity,
            price: d.price,
            note: d.note,
          }),
        ),
        totalAmount: checkoutModal.totalAmount,
        paymentMethod,
        customerPaid,
        change,
      };

      setCheckoutModal((prev) => ({ ...prev, isOpen: false }));
      await mutate();
      endMutation(true); // Skip regular toast

      // Mở modal in hóa đơn
      setInvoiceModal({
        isOpen: true,
        invoice,
      });
    } catch (err) {
      console.error(err);
      endMutation();
      alert("Có lỗi xảy ra khi thanh toán");
    }
  };

  const handleConfirmSwitchTable = async (currentTableId: number, targetTableId: number) => {
    try {
      startMutation();
      await axiosInstance.put(
        `/orders/switch-table?currentTableId=${currentTableId}&targetTableId=${targetTableId}`,
      );
      await mutate();
      endMutation();
      setToastMessage("Chuyển bàn thành công ✓");
    } catch (error: unknown) {
      endMutation();
      const err = error as { response?: { data?: { message?: string } } };
      alert(err.response?.data?.message || "Có lỗi xảy ra khi chuyển bàn");
    }
  };

  const handleOpenEditModal = (table: { id: number; name: string; status: string }) => {
    if (table.status === "OCCUPIED") {
      setErrorModal({
        isOpen: true,
        message: "Bàn đang có khách. Không thể sửa hoặc xóa",
      });
      return;
    }
    setEditingTable({ id: table.id, name: table.name });
    setEditTableName(table.name);
  };

  const handleSaveEditTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTable) return;

    // Check duplicate name
    const isDuplicate = tables.some(
      (t) =>
        t.id !== editingTable.id &&
        t.name.trim().toLowerCase() === editTableName.trim().toLowerCase(),
    );
    if (isDuplicate) return;

    try {
      setToastMessage("Cập nhật dữ liệu thành công ✓");
      setSaving(true);
      startMutation();
      await axiosInstance.put(`/tables/${editingTable.id}`, { name: editTableName.trim() });
      setEditingTable(null);
      await mutateTables();
      endMutation(); // Show SWR toast
    } catch (err: unknown) {
      console.error(err);
      endMutation();
      const backendMessage =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Có lỗi xảy ra khi sửa bàn";
      setErrorModal({
        isOpen: true,
        message: backendMessage,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTableClick = (table: { id: number; name: string; status: string }) => {
    if (table.status === "OCCUPIED") {
      setErrorModal({
        isOpen: true,
        message: "Bàn đang có khách. Không thể sửa hoặc xóa",
      });
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: "Xác nhận xóa bàn",
      message: `Bạn có chắc chắn muốn xóa ${table.name}?`,
      type: "danger",
      confirmText: "Xóa bàn",
      onConfirm: async () => {
        try {
          setToastMessage("Cập nhật dữ liệu thành công ✓");
          startMutation();
          await axiosInstance.delete(`/tables/${table.id}`);
          await mutateTables();
          endMutation(); // Show SWR toast
        } catch (err: unknown) {
          console.error(err);
          endMutation();
          const backendMessage =
            (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
            "Có lỗi xảy ra khi xóa bàn";
          setErrorModal({
            isOpen: true,
            message: backendMessage,
          });
        }
      },
    });
  };

  // Real-time duplication validation check
  const isDuplicate = editingTable
    ? tables.some(
        (t) =>
          t.id !== editingTable.id &&
          t.name.trim().toLowerCase() === editTableName.trim().toLowerCase(),
      )
    : false;

  return (
    <div className="space-y-6">
      <DataUpdatedToast show={showToast} message={toastMessage} />
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Sơ Đồ Bàn</h2>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={async () => {
              startMutation();
              await mutate();
              endMutation();
            }}
            disabled={showOverlay}
            className="bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-medium px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <RefreshCw size={18} className={showOverlay ? "animate-spin" : ""} /> Làm mới
          </button>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus size={20} /> Thêm Bàn Mới
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-500 font-medium">Đang tải dữ liệu...</p>
          </div>
        </div>
      ) : (
        <div className="relative">
          <MutatingOverlay show={showOverlay} />

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {tables.map((table) => {
              const isUsing = table.status === "OCCUPIED";
              return (
                <div
                  key={table.id}
                  className={`relative p-6 rounded-2xl border-2 flex flex-col items-center justify-center gap-3 transition-all duration-500 ${
                    isUsing
                      ? "bg-amber-50 border-amber-200 text-amber-600 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
                      : "bg-white border-emerald-200 text-emerald-600 hover:border-emerald-400 hover:shadow-lg"
                  }`}
                >
                  {/* 3-dot dropdown menu */}
                  <div className="absolute top-3 right-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenDropdownId(openDropdownId === table.id ? null : table.id);
                      }}
                      className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-full transition-colors"
                    >
                      <MoreVertical size={16} />
                    </button>
                    {openDropdownId === table.id && (
                      <div className="absolute right-0 mt-1 w-36 bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-1 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                        {isUsing && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenDropdownId(null);
                              setSwitchTableModal({
                                isOpen: true,
                                currentTable: table,
                              });
                            }}
                            className="w-full px-3 py-2 text-left text-sm font-semibold text-blue-600 hover:bg-blue-50 flex items-center gap-2 transition-colors border-b border-slate-100"
                          >
                            <ArrowRightLeft size={14} /> Chuyển bàn
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenDropdownId(null);
                            handleOpenEditModal(table);
                          }}
                          className="w-full px-3 py-2 text-left text-sm font-semibold text-emerald-600 hover:bg-emerald-50 flex items-center gap-2 transition-colors"
                        >
                          <Pencil size={14} /> Sửa
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenDropdownId(null);
                            handleDeleteTableClick(table);
                          }}
                          className="w-full px-3 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                        >
                          <Trash2 size={14} /> Xóa
                        </button>
                      </div>
                    )}
                  </div>

                  <Coffee size={40} className={isUsing ? "text-amber-500" : "text-emerald-500"} />
                  <span className="font-bold text-lg text-slate-800">{table.name}</span>

                  {isUsing ? (
                    <button
                      type="button"
                      onClick={() => handleCheckout(table.id)}
                      className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold bg-amber-500 text-slate-900 hover:bg-amber-600 transition-colors shadow-md"
                    >
                      <CheckCircle size={16} /> Thanh toán
                    </button>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 mt-2 border border-emerald-200">
                      Bàn trống
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal thêm bàn mới */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-800">Thêm bàn mới</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:bg-slate-100 p-2 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddTable} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tên bàn (Ví dụ: Bàn 01)
                </label>
                <input
                  required
                  type="text"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-slate-900 rounded-lg font-bold"
              >
                {saving ? "Đang lưu..." : "Lưu lại"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal sửa tên bàn */}
      {editingTable && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-800">Sửa tên bàn</h3>
              <button
                type="button"
                onClick={() => setEditingTable(null)}
                className="text-slate-400 hover:bg-slate-100 p-2 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveEditTable} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tên bàn mới</label>
                <input
                  required
                  type="text"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                  value={editTableName}
                  onChange={(e) => setEditTableName(e.target.value)}
                />
                {isDuplicate && (
                  <p className="text-red-500 text-xs font-bold mt-1">Bàn đã tồn tại</p>
                )}
              </div>
              <button
                type="submit"
                disabled={saving || isDuplicate}
                className="w-full py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-200 disabled:text-slate-400 text-slate-900 rounded-lg font-bold transition-colors"
              >
                {saving ? "Đang lưu..." : "Lưu lại"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal thông báo lỗi (X đỏ + OK) */}
      {errorModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <X size={32} className="text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">Thông báo lỗi</h3>
              <p className="text-slate-500 text-sm font-medium">{errorModal.message}</p>
              <button
                type="button"
                onClick={() => setErrorModal({ isOpen: false, message: "" })}
                className="w-full mt-4 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-red-500/20"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom ConfirmModal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        type={confirmModal.type}
        confirmText={confirmModal.confirmText}
      />

      {/* Modal Thanh toán (Tiền mặt / Chuyển khoản VietQR) */}
      <CheckoutModal
        isOpen={checkoutModal.isOpen}
        onClose={() => setCheckoutModal((prev) => ({ ...prev, isOpen: false }))}
        orderId={checkoutModal.orderId}
        tableName={checkoutModal.tableName}
        totalAmount={checkoutModal.totalAmount}
        onConfirmCheckout={handleConfirmCheckout}
      />

      {/* Modal In Hóa Đơn */}
      <InvoiceModal
        isOpen={invoiceModal.isOpen}
        onClose={() => setInvoiceModal({ isOpen: false, invoice: null })}
        invoice={invoiceModal.invoice}
      />

      {/* Modal Chuyển Bàn Nhanh */}
      <SwitchTableModal
        isOpen={switchTableModal.isOpen}
        onClose={() => setSwitchTableModal({ isOpen: false, currentTable: null })}
        currentTable={switchTableModal.currentTable}
        availableTables={tables.filter((t) => t.status === "AVAILABLE")}
        onConfirmSwitch={handleConfirmSwitchTable}
      />

      {/* Checkout Success Modal */}
      {checkoutSuccessModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-emerald-500 animate-bounce" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">Thành công</h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                {checkoutSuccessModal.message}
              </p>
              <button
                type="button"
                onClick={() => setCheckoutSuccessModal({ isOpen: false, message: "" })}
                className="w-full mt-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
