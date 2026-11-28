"use client";

import {
  Banknote,
  Check,
  CheckCircle,
  Coffee,
  CreditCard,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  ShoppingCart,
  Trash2,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { mutate as globalMutate } from "swr";
import { DataUpdatedToast, MutatingOverlay, useSmartOverlay } from "@/components/ui/LoadingOverlay";
import { type Product, useOrdersPageData } from "@/hooks/useOrdersPageData";
import { ApiError, apiClient } from "@/lib/api-client";

interface CartItem extends Product {
  quantity: number;
  note: string;
}

type OrderType = "DINE_IN" | "TAKEAWAY";
type PaymentMethod = "CASH" | "BANKING";

const MENU_PAGE_SIZE = 12;

function OrdersContent() {
  const searchParams = useSearchParams();
  const initialTableParam = searchParams.get("tableId");

  const [activeCategory, setActiveCategory] = useState<number | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleLimit, setVisibleLimit] = useState(MENU_PAGE_SIZE);

  const [orderType, setOrderType] = useState<OrderType>("DINE_IN");
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [saving, setSaving] = useState(false);

  const [errorMsg, setErrorMsg] = useState("");
  const [resultModal, setResultModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({ isOpen: false, title: "", message: "" });

  const { products, categories, tables, isLoading, isValidating, mutateTables } =
    useOrdersPageData();
  const { showOverlay, showToast, startMutation, endMutation } = useSmartOverlay(
    products,
    isValidating,
    isLoading,
  );

  // Tự động chọn bàn nếu điều hướng từ /tables?tableId=...
  useEffect(() => {
    if (initialTableParam) {
      const parsedId = Number(initialTableParam);
      if (!Number.isNaN(parsedId) && tables.some((t) => t.id === parsedId)) {
        setOrderType("DINE_IN");
        setSelectedTableId(parsedId);
      }
    }
  }, [initialTableParam, tables]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      if (activeCategory !== "ALL" && p.category?.id !== activeCategory) {
        return false;
      }
      if (q) {
        return (
          p.name.toLowerCase().includes(q) || (p.category?.name || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [products, activeCategory, searchQuery]);

  const displayedProducts = useMemo(
    () => filteredProducts.slice(0, visibleLimit),
    [filteredProducts, visibleLimit],
  );

  const addToCart = (product: Product) => {
    setErrorMsg("");
    setCart((prev) => {
      const exist = prev.find((p) => p.id === product.id);
      if (exist) {
        return prev.map((p) => (p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p));
      }
      return [...prev, { ...product, quantity: 1, note: "" }];
    });
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((p) => {
          if (p.id === id) {
            const newQ = p.quantity + delta;
            return newQ > 0 ? { ...p, quantity: newQ } : p;
          }
          return p;
        })
        .filter((p) => p.quantity > 0),
    );
  };

  const updateNote = (id: number, note: string) => {
    setCart((prev) => prev.map((p) => (p.id === id ? { ...p, note } : p)));
  };

  const removeFromCart = (id: number) => {
    setCart((prev) => prev.filter((p) => p.id !== id));
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const submitOrder = async (payImmediately: boolean) => {
    setErrorMsg("");
    if (orderType === "DINE_IN" && !selectedTableId) {
      setErrorMsg("Vui lòng chọn bàn trống cho đơn tại quán.");
      return;
    }
    if (cart.length === 0) {
      setErrorMsg("Giỏ hàng đang trống. Vui lòng chọn ít nhất một món.");
      return;
    }

    try {
      setSaving(true);
      startMutation();
      const payload = {
        tableId: orderType === "DINE_IN" ? selectedTableId : null,
        orderType,
        details: cart.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
          note: item.note.trim() || undefined,
        })),
      };

      const createdOrder = await apiClient.post<{ id: number }>("/orders", payload);

      if (payImmediately) {
        await apiClient.put(`/orders/${createdOrder.id}/checkout`, { paymentMethod });
      }

      setCart([]);
      setSelectedTableId(null);
      await mutateTables();
      await globalMutate("/orders");
      endMutation();

      setResultModal({
        isOpen: true,
        title: payImmediately ? "Tạo đơn & Thanh toán thành công" : "Đã tạo đơn phục vụ",
        message: payImmediately
          ? `Đơn #${createdOrder.id} đã hoàn tất thanh toán (${paymentMethod === "CASH" ? "Tiền mặt" : "Chuyển khoản"}).`
          : `Đơn #${createdOrder.id} đã được ghi nhận ở trạng thái Chờ thanh toán.`,
      });
    } catch (err) {
      endMutation();
      setErrorMsg(
        err instanceof ApiError
          ? err.message
          : "Có lỗi xảy ra khi xử lý đơn hàng. Vui lòng thử lại.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <MutatingOverlay show={showOverlay} />
      <DataUpdatedToast show={showToast} />

      <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-8rem)] lg:h-[calc(100vh-8rem)]">
        {/* Cột trái: Thực đơn sản phẩm */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[420px]">
          <div className="p-4 border-b border-slate-100 space-y-3">
            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Tìm kiếm món theo tên hoặc danh mục..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setVisibleLimit(MENU_PAGE_SIZE);
                  }}
                  className="w-full pl-10 pr-8 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    aria-label="Xóa từ khóa tìm kiếm"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>
              <span className="text-xs font-semibold text-slate-500 shrink-0">
                Hiển thị {displayedProducts.length} / {filteredProducts.length} món
              </span>
            </div>

            {/* Category Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => {
                  setActiveCategory("ALL");
                  setVisibleLimit(MENU_PAGE_SIZE);
                }}
                className={`px-4 py-1.5 rounded-full whitespace-nowrap text-sm font-medium transition-colors cursor-pointer ${
                  activeCategory === "ALL"
                    ? "bg-amber-500 text-slate-900 font-semibold"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Tất cả
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setActiveCategory(cat.id);
                    setVisibleLimit(MENU_PAGE_SIZE);
                  }}
                  className={`px-4 py-1.5 rounded-full whitespace-nowrap text-sm font-medium transition-colors cursor-pointer ${
                    activeCategory === cat.id
                      ? "bg-amber-500 text-slate-900 font-semibold"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="flex-1 flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-500 font-medium">Đang tải thực đơn...</p>
              </div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-16 text-slate-400">
              <Coffee size={44} className="opacity-25 mb-2" />
              <p className="font-semibold text-slate-600">Không tìm thấy món phù hợp</p>
              <p className="text-xs mt-1">Thử từ khóa khác hoặc chọn danh mục Tất cả</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                {displayedProducts.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => addToCart(p)}
                    className="text-left bg-slate-50 border border-slate-200 rounded-xl overflow-hidden cursor-pointer hover:border-amber-400 hover:shadow-md transition-all group"
                  >
                    <div className="h-28 sm:h-32 bg-slate-200 relative">
                      {p.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={
                            p.imageUrl.startsWith("http")
                              ? p.imageUrl
                              : `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080"}/uploads/${p.imageUrl}`
                          }
                          alt={p.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <Coffee size={32} />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-amber-500/0 group-hover:bg-amber-500/20 transition-all flex items-center justify-center">
                        <div className="bg-white text-slate-900 p-2 rounded-full opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all shadow-lg">
                          <Plus size={20} />
                        </div>
                      </div>
                    </div>
                    <div className="p-3 bg-white">
                      <h4 className="font-semibold text-slate-800 text-sm line-clamp-1">
                        {p.name}
                      </h4>
                      <p className="text-amber-600 font-bold text-sm mt-1">
                        {p.price.toLocaleString("vi-VN")} đ
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              {visibleLimit < filteredProducts.length && (
                <div className="flex justify-center pt-2">
                  <button
                    type="button"
                    onClick={() => setVisibleLimit((prev) => prev + MENU_PAGE_SIZE)}
                    className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Xem thêm món ({filteredProducts.length - visibleLimit} món còn lại)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Cột phải: Giỏ hàng responsive */}
        <div className="w-full lg:w-96 xl:w-[420px] shrink-0 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShoppingCart size={22} className="text-amber-600" />
              <h3 className="font-bold text-lg text-slate-800">Đơn hàng hiện tại</h3>
            </div>
            {cart.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                  {totalItemCount} món
                </span>
                <button
                  type="button"
                  onClick={() => setCart([])}
                  className="text-xs text-red-500 hover:underline font-medium cursor-pointer"
                >
                  Xóa hết
                </button>
              </div>
            )}
          </div>

          {/* Order Type: DINE_IN vs TAKEAWAY */}
          <div className="p-4 border-b border-slate-100 space-y-3">
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setOrderType("DINE_IN")}
                className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  orderType === "DINE_IN"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <UtensilsCrossed size={14} /> Tại bàn
              </button>
              <button
                type="button"
                onClick={() => {
                  setOrderType("TAKEAWAY");
                  setSelectedTableId(null);
                }}
                className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  orderType === "TAKEAWAY"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <ShoppingBag size={14} /> Mang đi
              </button>
            </div>

            {orderType === "DINE_IN" ? (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Chọn bàn trống ({tables.length} bàn sẵn sàng)
                </label>
                <select
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none font-medium"
                  value={selectedTableId || ""}
                  onChange={(e) => setSelectedTableId(Number(e.target.value) || null)}
                >
                  <option value="" disabled>
                    -- Vui lòng chọn bàn --
                  </option>
                  {tables.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 text-xs text-blue-700 font-medium">
                Đơn mang đi (TAKEAWAY) không gắn bàn. Có thể thanh toán ngay tại quầy.
              </div>
            )}
          </div>

          {/* Cart Items / Empty State */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 min-h-[200px]">
            {cart.length === 0 ? (
              <div className="h-full min-h-[180px] flex flex-col items-center justify-center text-center px-4">
                <div className="w-16 h-16 rounded-2xl bg-amber-100/70 text-amber-500 flex items-center justify-center mb-3">
                  <ShoppingCart size={30} />
                </div>
                <p className="font-bold text-slate-700 text-sm">Giỏ hàng đang trống</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  Chạm vào món ở thực đơn bên cạnh để thêm vào đơn hàng và ghi chú yêu cầu của
                  khách.
                </p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border border-slate-200/80 p-3 rounded-xl shadow-xs space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h5 className="font-semibold text-slate-800 text-sm truncate">{item.name}</h5>
                      <p className="text-amber-600 font-bold text-xs mt-0.5">
                        {(item.price * item.quantity).toLocaleString("vi-VN")} đ
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-1">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, -1)}
                          aria-label="Giảm số lượng"
                          className="p-1 hover:bg-white rounded text-slate-600 cursor-pointer"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="w-6 text-center font-bold text-xs text-slate-800">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, 1)}
                          aria-label="Tăng số lượng"
                          className="p-1 hover:bg-white rounded text-slate-600 cursor-pointer"
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        aria-label="Xóa món"
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <input
                    type="text"
                    placeholder="Ghi chú (VD: Ít đá, ít đường...)"
                    value={item.note}
                    onChange={(e) => updateNote(item.id, e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              ))
            )}
          </div>

          {/* Checkout Footer */}
          <div className="p-4 border-t border-slate-200 space-y-3 bg-white rounded-b-2xl">
            {errorMsg && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-medium px-3 py-2 rounded-xl">
                {errorMsg}
              </div>
            )}

            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium text-sm">Tổng tạm tính:</span>
              <span className="text-2xl font-black text-slate-900">
                {totalAmount.toLocaleString("vi-VN")} đ
              </span>
            </div>

            {/* Phương thức thanh toán nếu thanh toán ngay */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod("CASH")}
                className={`py-1.5 px-2 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                  paymentMethod === "CASH"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                    : "border-slate-200 text-slate-500"
                }`}
              >
                <Banknote size={14} /> Tiền mặt
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("BANKING")}
                className={`py-1.5 px-2 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                  paymentMethod === "BANKING"
                    ? "border-blue-500 bg-blue-50 text-blue-800"
                    : "border-slate-200 text-slate-500"
                }`}
              >
                <CreditCard size={14} /> Chuyển khoản
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => submitOrder(false)}
                disabled={
                  cart.length === 0 || (orderType === "DINE_IN" && !selectedTableId) || saving
                }
                className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-slate-200 disabled:text-slate-400 text-slate-900 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs cursor-pointer"
              >
                <Check size={16} /> {saving ? "Đang xử lý..." : "Tạo đơn (Lưu bàn)"}
              </button>
              <button
                type="button"
                onClick={() => submitOrder(true)}
                disabled={
                  cart.length === 0 || (orderType === "DINE_IN" && !selectedTableId) || saving
                }
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs cursor-pointer"
              >
                <CheckCircle size={16} /> Thanh toán ngay
              </button>
            </div>
          </div>
        </div>
      </div>

      {resultModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="p-6 text-center space-y-4">
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle size={28} className="text-emerald-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">{resultModal.title}</h3>
              <p className="text-slate-500 text-sm">{resultModal.message}</p>
              <button
                type="button"
                onClick={() => setResultModal({ isOpen: false, title: "", message: "" })}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl cursor-pointer"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function OrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <OrdersContent />
    </Suspense>
  );
}
