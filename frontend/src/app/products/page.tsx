"use client";

import {
  ChevronLeft,
  ChevronRight,
  Coffee,
  Edit2,
  Filter,
  ImageIcon,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { DataUpdatedToast, MutatingOverlay, useSmartOverlay } from "@/components/ui/LoadingOverlay";
import { type Product, useProductsData } from "@/hooks/useProductsData";
import { ApiError, apiClient } from "@/lib/api-client";

const PAGE_SIZE = 8;
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function resolveImageUrl(imageUrl?: string): string | null {
  if (!imageUrl) return null;
  if (imageUrl.startsWith("http")) return imageUrl;
  return `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080"}/uploads/${imageUrl}`;
}

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [page, setPage] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ name: "", price: "", categoryId: "" });
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [formError, setFormError] = useState("");
  const [pageError, setPageError] = useState("");

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const {
    products,
    totalElements,
    totalPages,
    categories,
    isLoading,
    isValidating,
    mutateProducts,
  } = useProductsData({ page, size: PAGE_SIZE, search, categoryId });
  const { showOverlay, showToast, startMutation, endMutation } = useSmartOverlay(
    products,
    isValidating,
    isLoading,
  );

  useEffect(() => {
    if (!file) {
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  const handleFileChange = (selectedFile: File | null) => {
    setFormError("");
    if (!selectedFile) {
      setFile(null);
      return;
    }
    if (!ALLOWED_IMAGE_TYPES.has(selectedFile.type)) {
      setFormError("Định dạng ảnh không hợp lệ. Chỉ hỗ trợ JPG, PNG, WEBP hoặc GIF.");
      setFile(null);
      return;
    }
    if (selectedFile.size > MAX_IMAGE_SIZE_BYTES) {
      setFormError("Dung lượng ảnh tối đa là 5MB. Vui lòng chọn ảnh nhẹ hơn.");
      setFile(null);
      return;
    }
    setFile(selectedFile);
  };

  const validateForm = (): string | null => {
    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      return "Tên sản phẩm không được để trống.";
    }
    if (trimmedName.length > 100) {
      return "Tên sản phẩm không được vượt quá 100 ký tự.";
    }
    const parsedPrice = Number(formData.price);
    if (Number.isNaN(parsedPrice) || parsedPrice <= 0) {
      return "Giá bán phải là số dương lớn hơn 0.";
    }
    if (!formData.categoryId) {
      return "Vui lòng chọn danh mục cho sản phẩm.";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    const data = new FormData();
    data.append("name", formData.name.trim());
    data.append("price", String(Number(formData.price)));
    data.append("categoryId", formData.categoryId);
    if (file) data.append("file", file);

    try {
      setSaving(true);
      startMutation();
      if (editingId) {
        await apiClient.put(`/products/${editingId}`, data);
      } else {
        await apiClient.post("/products", data);
      }
      setIsModalOpen(false);
      await mutateProducts();
      endMutation();
    } catch (err) {
      endMutation();
      setFormError(
        err instanceof ApiError
          ? err.message
          : "Không thể lưu sản phẩm. Vui lòng kiểm tra dữ liệu và thử lại.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (product: Product) => {
    setPageError("");
    setConfirmModal({
      isOpen: true,
      title: "Xác nhận xóa sản phẩm",
      message: `Bạn có chắc chắn muốn ngừng bán sản phẩm "${product.name}"?`,
      onConfirm: async () => {
        try {
          startMutation();
          await apiClient.delete(`/products/${product.id}`);
          await mutateProducts();
          endMutation();
        } catch (err) {
          endMutation();
          setPageError(
            err instanceof ApiError ? err.message : `Không thể xóa sản phẩm "${product.name}".`,
          );
        }
      },
    });
  };

  const openModal = (product?: Product) => {
    setFormError("");
    setFile(null);
    if (product) {
      setEditingId(product.id);
      setFormData({
        name: product.name,
        price: product.price.toString(),
        categoryId: product.category?.id?.toString() || "",
      });
      setPreviewUrl(resolveImageUrl(product.imageUrl));
    } else {
      setEditingId(null);
      setFormData({ name: "", price: "", categoryId: categories[0]?.id.toString() || "" });
      setPreviewUrl(null);
    }
    setIsModalOpen(true);
  };

  const parsedPricePreview = Number(formData.price);

  return (
    <div className="space-y-6">
      <MutatingOverlay show={showOverlay} />
      <DataUpdatedToast show={showToast} />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        type="danger"
        confirmText="Xóa sản phẩm"
      />

      {pageError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center justify-between">
          <span>{pageError}</span>
          <button
            type="button"
            onClick={() => setPageError("")}
            aria-label="Đóng thông báo lỗi"
            className="text-red-500 hover:text-red-700 p-1"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Search + Category Filter + Add Button */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              className="w-full pl-10 pr-8 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setPage(0);
                }}
                aria-label="Xóa tìm kiếm"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <div className="relative sm:w-56">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <select
              aria-label="Lọc theo danh mục"
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value ? Number(e.target.value) : "");
                setPage(0);
              }}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white font-medium text-slate-700"
            >
              <option value="">Tất cả danh mục</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={() => openModal()}
          className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shrink-0"
        >
          <Plus size={19} /> Thêm Sản Phẩm
        </button>
      </div>

      {/* Content: Loading / Desktop Table / Mobile Cards */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-500 font-medium">Đang tải dữ liệu...</p>
            </div>
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Coffee size={40} className="mx-auto opacity-25 mb-2" />
            <p className="font-semibold">Không tìm thấy sản phẩm nào</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                    <th className="p-4 font-semibold">Hình ảnh</th>
                    <th className="p-4 font-semibold">Tên sản phẩm</th>
                    <th className="p-4 font-semibold">Danh mục</th>
                    <th className="p-4 font-semibold">Giá bán</th>
                    <th className="p-4 font-semibold text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => {
                    const imgSrc = resolveImageUrl(p.imageUrl);
                    return (
                      <tr
                        key={p.id}
                        className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors"
                      >
                        <td className="p-4">
                          {imgSrc ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={imgSrc}
                              alt={p.name}
                              className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                              <ImageIcon size={18} />
                            </div>
                          )}
                        </td>
                        <td className="p-4 font-semibold text-slate-800">{p.name}</td>
                        <td className="p-4">
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                            {p.category?.name || "Chưa phân loại"}
                          </span>
                        </td>
                        <td className="p-4 text-emerald-600 font-bold">
                          {Number(p.price).toLocaleString("vi-VN")} đ
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openModal(p)}
                              aria-label={`Sửa ${p.name}`}
                              className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors cursor-pointer"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteClick(p)}
                              aria-label={`Xóa ${p.name}`}
                              className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List */}
            <div className="md:hidden divide-y divide-slate-100">
              {products.map((p) => {
                const imgSrc = resolveImageUrl(p.imageUrl);
                return (
                  <div key={p.id} className="p-4 flex items-center gap-3.5">
                    {imgSrc ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={imgSrc}
                        alt={p.name}
                        className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 shrink-0">
                        <ImageIcon size={22} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-800 text-sm truncate">{p.name}</h4>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">
                        {p.category?.name || "Chưa phân loại"}
                      </span>
                      <p className="text-emerald-600 font-extrabold text-sm mt-1">
                        {Number(p.price).toLocaleString("vi-VN")} đ
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => openModal(p)}
                        aria-label={`Sửa ${p.name}`}
                        className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg"
                      >
                        <Edit2 size={17} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteClick(p)}
                        aria-label={`Xóa ${p.name}`}
                        className="text-red-600 hover:bg-red-50 p-2 rounded-lg"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Pagination Bar */}
        {!isLoading && totalElements > 0 && (
          <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
            <span>
              Tổng <b>{totalElements}</b> sản phẩm • Trang <b>{page + 1}</b> /{" "}
              <b>{Math.max(totalPages, 1)}</b>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft size={14} /> Trước
              </button>
              <button
                type="button"
                disabled={page + 1 >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 font-semibold flex items-center gap-1 cursor-pointer"
              >
                Sau <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Thêm / Sửa Sản phẩm */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">
                {editingId ? "Cập nhật sản phẩm" : "Thêm sản phẩm mới"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="Đóng"
                className="text-slate-400 hover:bg-slate-100 p-2 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-medium px-3 py-2.5 rounded-xl">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tên sản phẩm
                </label>
                <input
                  required
                  maxLength={100}
                  type="text"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-sm"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Giá bán (VNĐ)
                  </label>
                  <input
                    required
                    min={1}
                    step="1000"
                    type="number"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-sm"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                  {!Number.isNaN(parsedPricePreview) && parsedPricePreview > 0 && (
                    <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                      Hiển thị: {parsedPricePreview.toLocaleString("vi-VN")} đ
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Danh mục</label>
                  <select
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-sm"
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  >
                    <option value="">Chọn danh mục</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Hình ảnh (JPG/PNG/WEBP/GIF, tối đa 5MB) {editingId && "(Bỏ trống nếu giữ nguyên)"}
                </label>
                <div className="flex items-center gap-4 mt-1">
                  {previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={previewUrl}
                      alt="Xem trước ảnh sản phẩm"
                      className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                      <ImageIcon size={22} />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-amber-50 file:text-amber-700 file:font-semibold hover:file:bg-amber-100"
                    onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-slate-900 rounded-xl font-bold cursor-pointer"
                >
                  {saving ? "Đang lưu..." : "Lưu lại"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
