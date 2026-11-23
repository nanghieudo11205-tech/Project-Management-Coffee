"use client";
import { AlertCircle, ArrowRightLeft, X } from "lucide-react";
import { useState } from "react";

interface TableItem {
  id: number;
  name: string;
  status: string;
}

interface SwitchTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTable: TableItem | null;
  availableTables: TableItem[];
  onConfirmSwitch: (currentTableId: number, targetTableId: number) => Promise<void>;
}

export function SwitchTableModal({
  isOpen,
  onClose,
  currentTable,
  availableTables,
  onConfirmSwitch,
}: SwitchTableModalProps) {
  const [selectedTargetId, setSelectedTargetId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen || !currentTable) return null;

  const handleConfirm = async () => {
    if (!selectedTargetId) return;
    try {
      setLoading(true);
      await onConfirmSwitch(currentTable.id, selectedTargetId);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5" />
            <h3 className="font-bold text-lg">Chuyển bàn</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/20 transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nội dung */}
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-sm font-semibold">
            <span>Bàn hiện tại:</span>
            <span className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-bold">
              {currentTable.name}
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Chọn bàn trống muốn chuyển tới:
            </label>

            {availableTables.length === 0 ? (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm flex items-center gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>Hiện tại không có bàn nào còn trống để chuyển sang!</span>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2.5 max-h-56 overflow-y-auto p-1">
                {availableTables.map((tbl) => {
                  const isSelected = selectedTargetId === tbl.id;
                  return (
                    <button
                      key={tbl.id}
                      type="button"
                      onClick={() => setSelectedTargetId(tbl.id)}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        isSelected
                          ? "border-blue-600 bg-blue-50 text-blue-900 font-bold shadow-sm ring-2 ring-blue-500"
                          : "border-slate-200 bg-white hover:border-slate-300 text-slate-700"
                      }`}
                    >
                      <div className="text-sm font-bold truncate">{tbl.name}</div>
                      <div className="text-[10px] text-emerald-600 font-medium">Trống</div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
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
            disabled={loading || !selectedTargetId}
            className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
          >
            {loading ? "Đang chuyển..." : "Xác nhận chuyển"}
          </button>
        </div>
      </div>
    </div>
  );
}
