"use client";
export const dynamic = "force-dynamic";

import {
  ArrowRightLeft,
  Banknote,
  CheckCircle,
  Clock,
  Coffee,
  Combine,
  CreditCard,
  MoreVertical,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShoppingBag,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { DataUpdatedToast, MutatingOverlay, useSmartOverlay } from "@/components/ui/LoadingOverlay";
import { type Order, type Table, useTablesData } from "@/hooks/useTablesData";
import { ApiError, apiClient } from "@/lib/api-client";

type TableFilter = "ALL" | "AVAILABLE" | "WAITING_PAYMENT" | "OCCUPIED";
type PaymentMethod = "CASH" | "BANKING";

export default function TablesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TableFilter>("ALL");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tableName, setTableName] = useState("");
  const [saving, setSaving] = useState(false);

  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const [editingTable, setEditingTable] = useState<{ id: number; name: string } | null>(null);
  const [editTableName, setEditTableName] = useState("");

  // Modal thanh toán
  const [checkoutOrder, setCheckoutOrder] = useState<Order | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");

  // Modal chuyển bàn
  const [transferOrder, setTransferOrder] = useState<Order | null>(null);
  const [transferTargetTableId, setTransferTargetTableId] = useState<number | "">("");

  // Modal gộp bàn
  const [mergeTargetOrder, setMergeTargetOrder] = useState<Order | null>(null);
  const [mergeSourceOrderId, setMergeSourceOrderId] = useState<number | "">("");

  const [errorModal, setErrorModal] = useState<{ isOpen: boolean; message: string }>({
    isOpen: false,
    message: "",
  });
  const [successModal, setSuccessModal] = useState<{ isOpen: boolean; message: string }>({
    isOpen: false,
    message: "",
  });
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
  const [toastMessage, setToastMessage] = useState("Cập nhật dữ liệu thành công ✓");

  const { tables, orders, isLoading, isValidating, mutate, mutateTables } = useTablesData();
  const { showOverlay, showToast, startMutation, endMutation } = useSmartOverlay(
    tables,
    isValidating,
    isLoading,
  );

  useEffect(() => {
    const handleOutsideClick = () => setOpenDropdownId(null);
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  const orderByTableId = useMemo(() => {
    const map = new Map<number, Order>();
    for (const o of orders) {
      if (o.cafeTable?.id) {
        map.set(o.cafeTable.id, o);
      }
    }
    return map;
  }, [orders]);

  const availableTables = useMemo(() => tables.filter((t) => t.status === "AVAILABLE"), [tables]);

  const summaryCounts = useMemo(() => {
    let available = 0;
    let waitingPayment = 0;
    let occupiedNoOrder = 0;
    for (const t of tables) {
      const activeOrder = orderByTableId.get(t.id);
      if (activeOrder) {
        waitingPayment += 1;
      } else if (t.status === "OCCUPIED") {
        occupiedNoOrder += 1;
      } else {
        available += 1;
      }
    }
    return {
      all: tables.length,
      available,
      waitingPayment,
      occupied: waitingPayment + occupiedNoOrder,
    };
  }, [tables, orderByTableId]);

  const filteredTables = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tables.filter((table) => {
      const activeOrder = orderByTableId.get(table.id);
      const isWaiting = Boolean(activeOrder);
      const isOccupied = table.status === "OCCUPIED" || isWaiting;

      if (statusFilter === "AVAILABLE" && isOccupied) return false;
      if (statusFilter === "WAITING_PAYMENT" && !isWaiting) return false;
      if (statusFilter === "OCCUPIED" && !isOccupied) return false;

      if (q) {
        const tableMatch = table.name.toLowerCase().includes(q);
        const orderMatch = activeOrder ? `#${activeOrder.id}`.includes(q) : false;
        return tableMatch || orderMatch;
      }
      return true;
    });
  }, [tables, orderByTableId, statusFilter, search]);

  const showError = (err: unknown, fallback: string) => {
    const message = err instanceof ApiError ? err.message : fallback;
    setErrorModal({ isOpen: true, message });
  };

  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setToastMessage("Thêm bàn thành công ✓");
      setSaving(true);
      startMutation();
      await apiClient.post("/tables", { name: tableName.trim(), status: "AVAILABLE" });
      setIsModalOpen(false);
      setTableName("");
      await mutateTables();
      endMutation();
    } catch (err) {
      endMutation();
      showError(err, "Không thể thêm bàn mới");
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmCheckout = async () => {
    if (!checkoutOrder) return;
    try {
      setSaving(true);
      startMutation();
      await apiClient.put(`/orders/${checkoutOrder.id}/checkout`, { paymentMethod });
      const tableNameLabel = checkoutOrder.cafeTable?.name || `Đơn #${checkoutOrder.id}`;
      setCheckoutOrder(null);
      await mutate();
      endMutation(true);
      setSuccessModal({
        isOpen: true,
        message: `Thanh toán thành công cho ${tableNameLabel} (${paymentMethod === "CASH" ? "Tiền mặt" : "Chuyển khoản"})!`,
      });
    } catch (err) {
      endMutation();
      showError(err, "Thanh toán thất bại");
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferOrder || !transferTargetTableId) return;
    try {
      setToastMessage("Chuyển bàn thành công ✓");
      setSaving(true);
      startMutation();
      await apiClient.put(`/orders/${transferOrder.id}/transfer-table`, {
        targetTableId: Number(transferTargetTableId),
      });
      setTransferOrder(null);
      setTransferTargetTableId("");
      await mutate();
      endMutation();
    } catch (err) {
      endMutation();
      showError(err, "Không thể chuyển bàn");
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmMerge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mergeTargetOrder || !mergeSourceOrderId) return;
    try {
      setToastMessage("Gộp bàn thành công ✓");
      setSaving(true);
      startMutation();
      await apiClient.post(`/orders/${mergeTargetOrder.id}/merge`, {
        sourceOrderId: Number(mergeSourceOrderId),
      });
      setMergeTargetOrder(null);
      setMergeSourceOrderId("");
      await mutate();
      endMutation();
    } catch (err) {
      endMutation();
      showError(err, "Không thể gộp bàn");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelOrder = (order: Order) => {
    setConfirmModal({
      isOpen: true,
      title: "Hủy đơn hàng",
      message: `Xác nhận hủy đơn #${order.id} tại ${order.cafeTable?.name || "bàn"} và trả bàn về trạng thái trống?`,
      type: "danger",
      confirmText: "Hủy đơn",
      onConfirm: async () => {
        try {
          setToastMessage("Đã hủy đơn và giải phóng bàn ✓");
          startMutation();
          await apiClient.put(`/orders/${order.id}/cancel`);
          await mutate();
          endMutation();
        } catch (err) {
          endMutation();
          showError(err, "Không thể hủy đơn hàng");
        }
      },
    });
  };

  const handleFreeEmptyOccupiedTable = async (table: Table) => {
    try {
      setToastMessage("Đã đưa bàn về trạng thái trống ✓");
      startMutation();
      await apiClient.put(`/tables/${table.id}/status?status=AVAILABLE`);
      await mutateTables();
      endMutation();
    } catch (err) {
      endMutation();
      showError(err, "Không thể cập nhật trạng thái bàn");
    }
  };

  const handleOpenEditModal = (table: Table) => {
    if (table.status === "OCCUPIED" || orderByTableId.has(table.id)) {
      setErrorModal({ isOpen: true, message: "Bàn đang có khách. Không thể sửa hoặc xóa" });
      return;
    }
    setEditingTable({ id: table.id, name: table.name });
    setEditTableName(table.name);
  };

  const handleSaveEditTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTable) return;
    try {
      setToastMessage("Cập nhật tên bàn thành công ✓");
      setSaving(true);
      startMutation();
      await apiClient.put(`/tables/${editingTable.id}`, { name: editTableName.trim() });
      setEditingTable(null);
      await mutateTables();
      endMutation();
    } catch (err) {
      endMutation();
      showError(err, "Có lỗi xảy ra khi sửa bàn");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTableClick = (table: Table) => {
    if (table.status === "OCCUPIED" || orderByTableId.has(table.id)) {
      setErrorModal({ isOpen: true, message: "Bàn đang có khách. Không thể sửa hoặc xóa" });
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
          setToastMessage("Đã xóa bàn thành công ✓");
          startMutation();
          await apiClient.delete(`/tables/${table.id}`);
          await mutateTables();
          endMutation();
        } catch (err) {
          endMutation();
          showError(err, "Có lỗi xảy ra khi xóa bàn");
        }
      },
    });
  };

  const isDuplicate = editingTable
    ? tables.some(
        (t) =>
          t.id !== editingTable.id &&
          t.name.trim().toLowerCase() === editTableName.trim().toLowerCase(),
      )
    : false;

  const mergeableOrders = mergeTargetOrder
    ? orders.filter((o) => o.id !== mergeTargetOrder.id && o.cafeTable?.id)
    : [];

  return (
    <div className="space-y-6">
      <DataUpdatedToast show={showToast} message={toastMessage} />

      {/* Header + Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Sơ Đồ Bàn & Trạng Thái Phục Vụ</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Theo dõi bàn trống, bàn đang phục vụ, chuyển bàn, gộp bàn và thanh toán
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={async () => {
              startMutation();
              await mutate();
              endMutation();
            }}
            disabled={showOverlay}
            className="bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-medium px-4 py-2 rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
          >
            <RefreshCw size={18} className={showOverlay ? "animate-spin" : ""} /> Làm mới
          </button>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold px-4 py-2 rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Plus size={20} /> Thêm Bàn Mới
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xs">
        <div className="relative w-full lg:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Tìm theo tên bàn hoặc mã đơn (#)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-8 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Xóa tìm kiếm"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={15} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {(
            [
              {
                key: "ALL",
                label: `Tất cả (${summaryCounts.all})`,
                activeCls: "bg-slate-900 text-white",
              },
              {
                key: "AVAILABLE",
                label: `Bàn trống (${summaryCounts.available})`,
                activeCls: "bg-emerald-600 text-white",
              },
              {
                key: "WAITING_PAYMENT",
                label: `Chờ thanh toán (${summaryCounts.waitingPayment})`,
                activeCls: "bg-amber-500 text-slate-900",
              },
              {
                key: "OCCUPIED",
                label: `Đang sử dụng (${summaryCounts.occupied})`,
                activeCls: "bg-orange-600 text-white",
              },
            ] as const
          ).map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setStatusFilter(f.key)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                statusFilter === f.key
                  ? f.activeCls
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table Grid */}
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

          {filteredTables.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
              <Coffee size={40} className="mx-auto opacity-25 mb-3" />
              <p className="font-semibold">Không có bàn nào khớp với bộ lọc hiện tại</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredTables.map((table) => {
                const activeOrder = orderByTableId.get(table.id);
                const isWaitingPayment = Boolean(activeOrder);
                const isOccupiedNoOrder = !isWaitingPayment && table.status === "OCCUPIED";

                const cardStyle = isWaitingPayment
                  ? "bg-amber-50/70 border-amber-300 shadow-sm"
                  : isOccupiedNoOrder
                    ? "bg-orange-50/60 border-orange-300"
                    : "bg-white border-emerald-200 hover:border-emerald-400 hover:shadow-md";

                const itemCount =
                  activeOrder?.orderDetails?.reduce((sum, d) => sum + d.quantity, 0) || 0;

                return (
                  <div
                    key={table.id}
                    className={`relative p-5 rounded-2xl border-2 flex flex-col justify-between gap-4 transition-all ${cardStyle}`}
                  >
                    {/* Top row: Icon + Name + Status Badge + 3-dot Menu */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`p-2.5 rounded-xl shrink-0 ${
                            isWaitingPayment
                              ? "bg-amber-500 text-slate-900"
                              : isOccupiedNoOrder
                                ? "bg-orange-500 text-white"
                                : "bg-emerald-100 text-emerald-600"
                          }`}
                        >
                          <Coffee size={22} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-base text-slate-800 truncate">
                            {table.name}
                          </h3>
                          {isWaitingPayment ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-200 text-amber-900 mt-1">
                              <Clock size={11} /> Chờ thanh toán
                            </span>
                          ) : isOccupiedNoOrder ? (
                            <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-bold bg-orange-200 text-orange-900 mt-1">
                              Đang sử dụng
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 mt-1">
                              Bàn trống
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 3-dot menu */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenDropdownId(openDropdownId === table.id ? null : table.id);
                          }}
                          aria-label={`Tùy chọn cho ${table.name}`}
                          className="text-slate-400 hover:text-slate-600 hover:bg-white/80 p-1.5 rounded-full transition-colors cursor-pointer"
                        >
                          <MoreVertical size={16} />
                        </button>
                        {openDropdownId === table.id && (
                          <div className="absolute right-0 mt-1 w-32 bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-1 overflow-hidden">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenDropdownId(null);
                                handleOpenEditModal(table);
                              }}
                              className="w-full px-3 py-2 text-left text-sm font-semibold text-emerald-600 hover:bg-emerald-50 flex items-center gap-2 cursor-pointer"
                            >
                              <Pencil size={14} /> Sửa tên
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenDropdownId(null);
                                handleDeleteTableClick(table);
                              }}
                              className="w-full px-3 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                            >
                              <Trash2 size={14} /> Xóa bàn
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Middle: Order Details Summary */}
                    {activeOrder ? (
                      <div className="bg-white/90 rounded-xl p-3 border border-amber-200/80 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between text-slate-500">
                          <span>Đơn #{activeOrder.id}</span>
                          <span>{itemCount} món</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600 font-medium">Tạm tính:</span>
                          <span className="text-base font-extrabold text-emerald-700">
                            {Number(activeOrder.totalAmount || 0).toLocaleString("vi-VN")} đ
                          </span>
                        </div>
                        {activeOrder.createdAt && (
                          <p className="text-[11px] text-slate-400">
                            Mở lúc{" "}
                            {new Date(activeOrder.createdAt).toLocaleTimeString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        )}
                      </div>
                    ) : isOccupiedNoOrder ? (
                      <div className="bg-white/80 rounded-xl p-3 border border-orange-200 text-xs text-slate-600">
                        Bàn đang ở trạng thái sử dụng nhưng chưa có đơn hàng hoạt động.
                      </div>
                    ) : (
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs text-slate-500">
                        Sẵn sàng đón khách mới hoặc làm bàn đích khi chuyển/gộp.
                      </div>
                    )}

                    {/* Bottom Actions */}
                    {activeOrder ? (
                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={() => {
                            setPaymentMethod("CASH");
                            setCheckoutOrder(activeOrder);
                          }}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold bg-amber-500 text-slate-900 hover:bg-amber-600 transition-colors shadow-sm cursor-pointer"
                        >
                          <CheckCircle size={15} /> Thanh toán ngay
                        </button>
                        <div className="grid grid-cols-3 gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setTransferTargetTableId(availableTables[0]?.id ?? "");
                              setTransferOrder(activeOrder);
                            }}
                            disabled={availableTables.length === 0}
                            title="Chuyển sang bàn trống khác"
                            className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                          >
                            <ArrowRightLeft size={12} /> Chuyển
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const others = orders.filter(
                                (o) => o.id !== activeOrder.id && o.cafeTable?.id,
                              );
                              setMergeSourceOrderId(others[0]?.id ?? "");
                              setMergeTargetOrder(activeOrder);
                            }}
                            disabled={
                              orders.filter((o) => o.id !== activeOrder.id && o.cafeTable?.id)
                                .length === 0
                            }
                            title="Gộp đơn từ bàn khác vào bàn này"
                            className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                          >
                            <Combine size={12} /> Gộp
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCancelOrder(activeOrder)}
                            title="Hủy đơn hàng này"
                            className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold bg-white border border-red-200 text-red-600 hover:bg-red-50 cursor-pointer"
                          >
                            <XCircle size={12} /> Hủy
                          </button>
                        </div>
                      </div>
                    ) : isOccupiedNoOrder ? (
                      <button
                        type="button"
                        onClick={() => handleFreeEmptyOccupiedTable(table)}
                        className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-orange-600 text-white hover:bg-orange-700 transition-colors cursor-pointer"
                      >
                        Trả về bàn trống
                      </button>
                    ) : (
                      <Link
                        href={`/orders?tableId=${table.id}`}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                      >
                        <ShoppingBag size={15} /> Mở bàn & Gọi món
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal Thanh toán (CASH / BANKING) */}
      {checkoutOrder && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  Thanh toán • {checkoutOrder.cafeTable?.name || `Đơn #${checkoutOrder.id}`}
                </h3>
                <p className="text-xs text-slate-500">Đơn hàng #{checkoutOrder.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setCheckoutOrder(null)}
                aria-label="Đóng"
                className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {checkoutOrder.orderDetails && checkoutOrder.orderDetails.length > 0 && (
                <div className="max-h-44 overflow-y-auto bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-2 text-xs">
                  {checkoutOrder.orderDetails.map((d) => (
                    <div key={d.id} className="flex justify-between gap-2">
                      <span className="text-slate-700">
                        {d.product?.name || "Món"} × <b>{d.quantity}</b>
                        {d.note ? <em className="text-slate-400 ml-1">({d.note})</em> : null}
                      </span>
                      <span className="font-semibold text-slate-800 shrink-0">
                        {(Number(d.price) * d.quantity).toLocaleString("vi-VN")} đ
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
                <span className="text-sm font-semibold text-emerald-800">Tổng cần thu:</span>
                <span className="text-2xl font-black text-emerald-700">
                  {Number(checkoutOrder.totalAmount || 0).toLocaleString("vi-VN")} đ
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-2">
                  Phương thức thanh toán
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("CASH")}
                    className={`p-3 rounded-xl border-2 flex items-center justify-center gap-2 text-sm font-bold transition-all cursor-pointer ${
                      paymentMethod === "CASH"
                        ? "border-amber-500 bg-amber-50 text-slate-900"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Banknote size={18} /> Tiền mặt
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("BANKING")}
                    className={`p-3 rounded-xl border-2 flex items-center justify-center gap-2 text-sm font-bold transition-all cursor-pointer ${
                      paymentMethod === "BANKING"
                        ? "border-blue-500 bg-blue-50 text-blue-900"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <CreditCard size={18} /> Chuyển khoản
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCheckoutOrder(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleConfirmCheckout}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-bold cursor-pointer"
                >
                  {saving ? "Đang xử lý..." : "Xác nhận thanh toán"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Chuyển bàn */}
      {transferOrder && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">
                Chuyển bàn • {transferOrder.cafeTable?.name}
              </h3>
              <button
                type="button"
                onClick={() => setTransferOrder(null)}
                aria-label="Đóng"
                className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleConfirmTransfer} className="p-5 space-y-4">
              <p className="text-xs text-slate-500">
                Đơn <b>#{transferOrder.id}</b> sẽ được chuyển toàn bộ sang bàn trống mới.
              </p>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Chọn bàn trống đích
                </label>
                <select
                  required
                  value={transferTargetTableId}
                  onChange={(e) => setTransferTargetTableId(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  <option value="" disabled>
                    -- Chọn bàn trống --
                  </option>
                  {availableTables.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setTransferOrder(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving || !transferTargetTableId}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-slate-900 font-bold"
                >
                  {saving ? "Đang chuyển..." : "Chuyển bàn"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Gộp bàn */}
      {mergeTargetOrder && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">
                Gộp bàn vào {mergeTargetOrder.cafeTable?.name}
              </h3>
              <button
                type="button"
                onClick={() => setMergeTargetOrder(null)}
                aria-label="Đóng"
                className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleConfirmMerge} className="p-5 space-y-4">
              <p className="text-xs text-slate-500">
                Toàn bộ món từ bàn được chọn sẽ gộp vào đơn <b>#{mergeTargetOrder.id}</b> (
                {mergeTargetOrder.cafeTable?.name}), sau đó bàn nguồn trở về trạng thái trống.
              </p>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Chọn bàn nguồn cần gộp vào
                </label>
                <select
                  required
                  value={mergeSourceOrderId}
                  onChange={(e) => setMergeSourceOrderId(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  <option value="" disabled>
                    -- Chọn bàn đang có đơn --
                  </option>
                  {mergeableOrders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.cafeTable?.name} (Đơn #{o.id} -{" "}
                      {Number(o.totalAmount || 0).toLocaleString("vi-VN")} đ)
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setMergeTargetOrder(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving || !mergeSourceOrderId}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-slate-900 font-bold"
                >
                  {saving ? "Đang gộp..." : "Xác nhận gộp bàn"}
                </button>
              </div>
            </form>
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
                aria-label="Đóng"
                className="text-slate-400 hover:bg-slate-100 p-2 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddTable} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tên bàn (Ví dụ: Bàn 06)
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
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-slate-900 rounded-xl font-bold"
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
                aria-label="Đóng"
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
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-200 disabled:text-slate-400 text-slate-900 rounded-xl font-bold transition-colors"
              >
                {saving ? "Đang lưu..." : "Lưu lại"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal thông báo lỗi */}
      {errorModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="p-6 text-center space-y-4">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <X size={28} className="text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Thông báo lỗi</h3>
              <p className="text-slate-500 text-sm font-medium">{errorModal.message}</p>
              <button
                type="button"
                onClick={() => setErrorModal({ isOpen: false, message: "" })}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 rounded-xl cursor-pointer"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        type={confirmModal.type}
        confirmText={confirmModal.confirmText}
      />

      {successModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="p-6 text-center space-y-4">
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle size={28} className="text-emerald-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Thành công</h3>
              <p className="text-slate-500 text-sm font-medium">{successModal.message}</p>
              <button
                type="button"
                onClick={() => setSuccessModal({ isOpen: false, message: "" })}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 rounded-xl cursor-pointer"
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
