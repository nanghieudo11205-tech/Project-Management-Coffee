"use client";

import { Edit2, Plus, Search, Trash2, UserCheck, X } from "lucide-react";
import { useMemo, useState } from "react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { DataUpdatedToast, MutatingOverlay, useSmartOverlay } from "@/components/ui/LoadingOverlay";
import type { EmployeeItem } from "@/hooks/useEmployeesData";
import { useEmployeesData } from "@/hooks/useEmployeesData";
import axiosInstance from "@/lib/axios";

export default function EmployeesPage() {
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    identityCard: "",
    dateOfBirth: "",
    position: "Phục vụ",
    hireDate: new Date().toISOString().split("T")[0],
    salary: 0,
    accountId: "" as number | string,
  });

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

  const { employees, accounts, isLoading, isValidating, mutate } = useEmployeesData();
  const { showOverlay, showToast, startMutation, endMutation } = useSmartOverlay(
    employees,
    isValidating,
    isLoading,
  );

  const openModal = (emp?: EmployeeItem) => {
    if (emp) {
      setEditingId(emp.id);
      setFormData({
        fullName: emp.fullName || "",
        phoneNumber: emp.phoneNumber || "",
        identityCard: emp.identityCard || "",
        dateOfBirth: emp.dateOfBirth ? emp.dateOfBirth.split("T")[0] : "",
        position: emp.position || "Phục vụ",
        hireDate: emp.hireDate ? emp.hireDate.split("T")[0] : "",
        salary: emp.salary || 0,
        accountId: emp.account ? emp.account.id : "",
      });
    } else {
      setEditingId(null);
      setFormData({
        fullName: "",
        phoneNumber: "",
        identityCard: "",
        dateOfBirth: "",
        position: "Phục vụ",
        hireDate: new Date().toISOString().split("T")[0],
        salary: 5000000,
        accountId: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      startMutation();
      const payload = {
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber || null,
        identityCard: formData.identityCard || null,
        dateOfBirth: formData.dateOfBirth || null,
        position: formData.position,
        hireDate: formData.hireDate || null,
        salary: Number(formData.salary) || 0,
        accountId: formData.accountId ? Number(formData.accountId) : null,
      };

      if (editingId) {
        await axiosInstance.put(`/employees/${editingId}`, payload);
      } else {
        await axiosInstance.post("/employees", payload);
      }
      setIsModalOpen(false);
      await mutate();
      endMutation();
    } catch (error: unknown) {
      endMutation();
      const err = error as { response?: { data?: { message?: string } } };
      alert(err.response?.data?.message || "Có lỗi xảy ra khi lưu thông tin nhân viên");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (emp: EmployeeItem) => {
    setConfirmModal({
      isOpen: true,
      title: "Xác nhận xóa nhân viên",
      message: `Bạn có chắc muốn xóa nhân viên "${emp.fullName}"? Dữ liệu nhân viên sẽ được lưu trữ an toàn.`,
      onConfirm: async () => {
        try {
          startMutation();
          await axiosInstance.delete(`/employees/${emp.id}`);
          await mutate();
          endMutation();
        } catch {
          endMutation();
          alert("Không thể xóa nhân viên này.");
        }
      },
    });
  };

  const filteredEmployees = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter(
      (e) =>
        e.fullName?.toLowerCase().includes(q) ||
        e.phoneNumber?.toLowerCase().includes(q) ||
        e.position?.toLowerCase().includes(q) ||
        e.account?.username?.toLowerCase().includes(q),
    );
  }, [employees, search]);

  const positionBadgeColor: Record<string, string> = {
    "Quản lý": "bg-amber-100 text-amber-800 border-amber-200",
    "Pha chế": "bg-purple-100 text-purple-800 border-purple-200",
    "Thu ngân": "bg-emerald-100 text-emerald-800 border-emerald-200",
    "Phục vụ": "bg-blue-100 text-blue-800 border-blue-200",
    "Bảo vệ": "bg-slate-100 text-slate-800 border-slate-200",
  };

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
        confirmText="Xóa nhân viên"
      />

      <div className="flex items-center justify-between">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Tìm theo họ tên, SĐT, chức vụ..."
            className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 w-80"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          type="button"
          onClick={() => openModal()}
          className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors cursor-pointer shadow-sm"
        >
          <Plus size={20} /> Thêm Nhân Viên
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative">
        <MutatingOverlay show={showOverlay} />
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-500 font-medium">Đang tải dữ liệu...</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-sm text-slate-500">
                  <th className="p-4 font-medium w-16">STT</th>
                  <th className="p-4 font-medium">Họ và tên</th>
                  <th className="p-4 font-medium">Chức vụ</th>
                  <th className="p-4 font-medium">Số điện thoại</th>
                  <th className="p-4 font-medium">CCCD</th>
                  <th className="p-4 font-medium">Lương cơ bản</th>
                  <th className="p-4 font-medium">Tài khoản liên kết</th>
                  <th className="p-4 font-medium text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEmployees.map((emp, idx) => (
                  <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 text-slate-500 font-mono text-sm">#{idx + 1}</td>
                    <td className="p-4">
                      <div className="font-bold text-slate-800">{emp.fullName}</div>
                      {emp.dateOfBirth && (
                        <div className="text-xs text-slate-400">
                          NS: {new Date(emp.dateOfBirth).toLocaleDateString("vi-VN")}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                          positionBadgeColor[emp.position || ""] || "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {emp.position || "Nhân viên"}
                      </span>
                    </td>
                    <td className="p-4 text-sm font-medium text-slate-600">
                      {emp.phoneNumber || "—"}
                    </td>
                    <td className="p-4 text-sm font-mono text-slate-500">
                      {emp.identityCard || "—"}
                    </td>
                    <td className="p-4 text-sm font-bold text-amber-700">
                      {emp.salary ? `${emp.salary.toLocaleString("vi-VN")} đ` : "—"}
                    </td>
                    <td className="p-4">
                      {emp.account ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                          <UserCheck size={13} className="text-emerald-600" />
                          {emp.account.username} ({emp.account.role})
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Chưa liên kết</span>
                      )}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => openModal(emp)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title="Sửa nhân viên"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteClick(emp)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Xóa nhân viên"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredEmployees.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400 font-medium">
                      Không tìm thấy nhân viên nào
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Thêm / Sửa Nhân viên */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">
                {editingId ? "Chỉnh sửa thông tin nhân viên" : "Thêm nhân viên mới"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:bg-slate-200 p-2 rounded-lg transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nguyễn Văn A"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    placeholder="0901234567"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Số CCCD / CMND
                  </label>
                  <input
                    type="text"
                    placeholder="00120000xxxx"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                    value={formData.identityCard}
                    onChange={(e) => setFormData({ ...formData, identityCard: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Chức vụ</label>
                  <select
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  >
                    <option value="Quản lý">Quản lý</option>
                    <option value="Pha chế">Pha chế</option>
                    <option value="Thu ngân">Thu ngân</option>
                    <option value="Phục vụ">Phục vụ</option>
                    <option value="Bảo vệ">Bảo vệ</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Lương cơ bản (VNĐ)
                  </label>
                  <input
                    type="number"
                    step={100000}
                    placeholder="5000000"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                    value={formData.salary || ""}
                    onChange={(e) => setFormData({ ...formData, salary: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Ngày sinh
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Ngày vào làm
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                    value={formData.hireDate}
                    onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Liên kết tài khoản đăng nhập
                </label>
                <select
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                  value={formData.accountId}
                  onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                >
                  <option value="">-- Chưa liên kết tài khoản --</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.username} ({acc.role})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-400 mt-1">
                  Nhân viên có thể dùng tài khoản này để đăng nhập vào hệ thống POS.
                </p>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold px-5 py-2 rounded-lg transition-colors text-sm disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {saving ? "Đang lưu..." : editingId ? "Cập nhật" : "Thêm mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
