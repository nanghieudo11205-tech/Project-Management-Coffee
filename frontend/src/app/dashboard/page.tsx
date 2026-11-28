"use client";

import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import {
  ArrowUpRight,
  Award,
  Clock,
  Coffee,
  DollarSign,
  Info,
  ShoppingBag,
  UtensilsCrossed,
  X,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Chart } from "react-chartjs-2";
import { DataUpdatedToast, MutatingOverlay, useSmartOverlay } from "@/components/ui/LoadingOverlay";
import RevenueDetailModal from "@/components/ui/RevenueDetailModal";
import { type RevenuePeriodType, useDashboardData } from "@/hooks/useDashboardData";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  href?: string;
  onClick?: () => void;
}

const ORDER_STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "Chờ thanh toán", cls: "bg-amber-100 text-amber-700" },
  PAID: { label: "Đã thanh toán", cls: "bg-emerald-100 text-emerald-700" },
  CANCELLED: { label: "Đã hủy", cls: "bg-red-100 text-red-700" },
};

function formatChartPeriodLabel(period: string, type: RevenuePeriodType): string {
  if (type === "day") {
    const date = new Date(period);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
    }
    return period;
  }
  if (type === "week") {
    const parts = period.split("-W");
    return parts.length === 2 ? `Tuần ${parts[1]}/${parts[0]}` : period;
  }
  const parts = period.split("-");
  return parts.length === 2 ? `Th${parts[1]}/${parts[0]}` : period;
}

export default function Dashboard() {
  const [periodType, setPeriodType] = useState<RevenuePeriodType>("day");
  const { stats, chartRevenueData, topProducts, recentOrders, isLoading, isValidating } =
    useDashboardData(periodType);
  const { showOverlay, showToast } = useSmartOverlay(stats, isValidating, isLoading);
  const [revenueModalOpen, setRevenueModalOpen] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);

  const sortedChartData = [...chartRevenueData]
    .sort((a, b) => a.period.localeCompare(b.period))
    .slice(-14);
  const chartLabels = sortedChartData.map((d) => formatChartPeriodLabel(d.period, periodType));
  const chartRevenues = sortedChartData.map((d) => d.totalRevenue);
  const chartOrders = sortedChartData.map((d) => d.totalOrders);

  const comboChartData = {
    labels: chartLabels.length > 0 ? chartLabels : ["Chưa có dữ liệu"],
    datasets: [
      {
        type: "bar" as const,
        label: "Doanh thu (đ)",
        data: chartRevenues.length > 0 ? chartRevenues : [0],
        backgroundColor: "rgba(16, 185, 129, 0.65)",
        borderColor: "rgb(16, 185, 129)",
        borderWidth: 1,
        borderRadius: 6,
        maxBarThickness: 48,
        yAxisID: "y",
        order: 2,
      },
      {
        type: "line" as const,
        label: "Số đơn hàng",
        data: chartOrders.length > 0 ? chartOrders : [0],
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        borderWidth: 2.5,
        pointBackgroundColor: "rgb(59, 130, 246)",
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.35,
        fill: false,
        yAxisID: "y1",
        order: 1,
      },
    ],
  };

  const comboChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index" as const, intersect: false },
    plugins: {
      legend: {
        position: "top" as const,
        labels: { usePointStyle: true, padding: 20, font: { size: 12, weight: "bold" as const } },
      },
      tooltip: {
        callbacks: {
          label: (ctx: { dataset: { label?: string }; parsed: { y: number | null } }) => {
            const label = ctx.dataset.label || "";
            const val = ctx.parsed.y ?? 0;
            if (label.includes("Doanh thu")) return `${label}: ${val.toLocaleString("vi-VN")} đ`;
            return `${label}: ${val}`;
          },
        },
      },
    },
    scales: {
      y: {
        type: "linear" as const,
        display: true,
        position: "left" as const,
        border: { display: false },
        grid: { color: "#f1f5f9" },
        ticks: {
          callback: (value: string | number) => {
            const num = typeof value === "string" ? Number.parseFloat(value) : value;
            if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
            if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
            return String(num);
          },
          font: { size: 11 },
        },
        title: {
          display: true,
          text: "Doanh thu (đ)",
          font: { size: 11, weight: "bold" as const },
          color: "#10b981",
        },
      },
      y1: {
        type: "linear" as const,
        display: true,
        position: "right" as const,
        border: { display: false },
        grid: { drawOnChartArea: false },
        ticks: { stepSize: 1, font: { size: 11 } },
        title: {
          display: true,
          text: "Số đơn",
          font: { size: 11, weight: "bold" as const },
          color: "#3b82f6",
        },
      },
      x: { border: { display: false }, grid: { display: false }, ticks: { font: { size: 11 } } },
    },
  };

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-500 font-medium">Đang tải dữ liệu...</p>
          </div>
        </div>
      ) : (
        <>
          <DataUpdatedToast show={showToast} />

          {/* 4 Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 relative">
            <MutatingOverlay show={showOverlay} />
            <StatCard
              title="Tổng Doanh Thu"
              value={`${stats.revenue.toLocaleString("vi-VN")} đ`}
              subtitle="Đơn hàng đã thanh toán"
              icon={DollarSign}
              color="text-emerald-600"
              bg="bg-emerald-100"
              onClick={() => setRevenueModalOpen(true)}
            />
            <StatCard
              title="Tổng Đơn Hàng"
              value={stats.orders}
              subtitle="Xem lịch sử chi tiết"
              icon={ShoppingBag}
              color="text-blue-600"
              bg="bg-blue-100"
              href="/order-history"
            />
            <StatCard
              title="Bàn Đang Sử Dụng"
              value={`${stats.occupiedTables} / ${stats.totalTables}`}
              subtitle={
                stats.totalTables > 0
                  ? `${stats.totalTables - stats.occupiedTables} bàn đang trống`
                  : "Chưa có dữ liệu bàn"
              }
              icon={UtensilsCrossed}
              color="text-rose-600"
              bg="bg-rose-100"
              href="/tables"
            />
            <StatCard
              title="Tổng Sản Phẩm"
              value={stats.products}
              subtitle="Đang mở bán trên menu"
              icon={Coffee}
              color="text-amber-600"
              bg="bg-amber-100"
              href="/products"
            />
          </div>

          {/* Chart + Period Filter (Day / Week / Month) */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Biểu đồ Doanh thu & Đơn hàng</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Theo dõi hiệu quả bán hàng theo ngày, tuần hoặc tháng
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                  {(
                    [
                      { key: "day", label: "Theo Ngày" },
                      { key: "week", label: "Theo Tuần" },
                      { key: "month", label: "Theo Tháng" },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setPeriodType(tab.key)}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        periodType === tab.key
                          ? "bg-white text-slate-900 shadow-xs"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setRevenueModalOpen(true)}
                  className="text-sm text-amber-600 font-semibold hover:text-amber-700 flex items-center gap-1 cursor-pointer"
                >
                  Xem chi tiết <ArrowUpRight size={16} />
                </button>
              </div>
            </div>
            <div className="h-[360px]">
              <Chart type="bar" options={comboChartOptions} data={comboChartData} />
            </div>
          </div>

          {/* Top Products & Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sản phẩm bán chạy */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-100 text-amber-600">
                    <Award size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">Sản phẩm bán chạy</h3>
                    <p className="text-xs text-slate-500">Top đồ uống được gọi nhiều nhất</p>
                  </div>
                </div>
                <Link
                  href="/products"
                  className="text-xs font-semibold text-amber-600 hover:text-amber-700"
                >
                  Xem thực đơn →
                </Link>
              </div>

              {topProducts.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-10 text-slate-400">
                  <Coffee size={36} className="opacity-25 mb-2" />
                  <p className="text-sm">Chưa có dữ liệu đơn hàng đã thanh toán</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {topProducts.map((item, index) => (
                    <div
                      key={item.productName}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                            index === 0
                              ? "bg-amber-500 text-slate-900"
                              : index === 1
                                ? "bg-slate-300 text-slate-800"
                                : "bg-slate-200 text-slate-700"
                          }`}
                        >
                          #{index + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">
                            {item.productName}
                          </p>
                          <p className="text-xs text-slate-500">
                            Đã bán: <span className="font-bold">{item.totalQuantity}</span> ly/phần
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-emerald-600 shrink-0 ml-3">
                        {Number(item.totalRevenue || 0).toLocaleString("vi-VN")} đ
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Hoạt động gần đây */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-100 text-blue-600">
                    <Clock size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">Hoạt động gần đây</h3>
                    <p className="text-xs text-slate-500">Các đơn hàng mới nhất trong quán</p>
                  </div>
                </div>
                <Link
                  href="/order-history"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  Tất cả đơn →
                </Link>
              </div>

              {recentOrders.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-10 text-slate-400">
                  <ShoppingBag size={36} className="opacity-25 mb-2" />
                  <p className="text-sm">Chưa có hoạt động đơn hàng nào</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentOrders.map((order) => {
                    const badge = ORDER_STATUS_BADGE[order.status] || {
                      label: order.status,
                      cls: "bg-slate-100 text-slate-700",
                    };
                    const timeLabel = new Date(order.createdAt).toLocaleString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      day: "2-digit",
                      month: "2-digit",
                    });
                    return (
                      <div
                        key={order.id}
                        className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-slate-800">
                              Đơn #{order.id}
                            </span>
                            <span className="text-xs text-slate-500">
                              • {order.cafeTable?.name || "Mang đi"}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${badge.cls}`}
                            >
                              {badge.label}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            {timeLabel}
                            {order.account?.username ? ` • NV: ${order.account.username}` : ""}
                            {order.paymentMethod ? ` • ${order.paymentMethod}` : ""}
                          </p>
                        </div>
                        <span className="text-sm font-bold text-slate-800 shrink-0">
                          {Number(order.totalAmount || 0).toLocaleString("vi-VN")} đ
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Footer với liên kết chức năng thực tế */}
          <footer className="mt-8 bg-amber-50/60 border border-slate-200/80 rounded-2xl pt-7 pb-5 px-6 sm:px-8 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6 text-sm">
              <div>
                <h4 className="text-slate-800 font-bold mb-3">Vận hành quán</h4>
                <ul className="space-y-2.5 text-slate-600">
                  <li>
                    <Link
                      href="/tables"
                      className="hover:text-amber-600 transition-colors font-medium"
                    >
                      Sơ đồ bàn & Thanh toán
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/orders"
                      className="hover:text-amber-600 transition-colors font-medium"
                    >
                      Tạo đơn hàng POS
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/order-history"
                      className="hover:text-amber-600 transition-colors font-medium"
                    >
                      Quản lý lịch sử đơn hàng
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-slate-800 font-bold mb-3">Báo cáo & Kho món</h4>
                <ul className="space-y-2.5 text-slate-600">
                  <li>
                    <button
                      type="button"
                      onClick={() => setRevenueModalOpen(true)}
                      className="hover:text-amber-600 transition-colors font-medium cursor-pointer"
                    >
                      Báo cáo doanh thu chi tiết
                    </button>
                  </li>
                  <li>
                    <Link
                      href="/products"
                      className="hover:text-amber-600 transition-colors font-medium"
                    >
                      Quản lý thực đơn & Giá bán
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/ai-assistant"
                      className="hover:text-amber-600 transition-colors font-medium"
                    >
                      Trợ lý AI phân tích kinh doanh
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-slate-800 font-bold mb-3">Hệ thống & Hỗ trợ</h4>
                <ul className="space-y-2.5 text-slate-600">
                  <li>
                    <button
                      type="button"
                      onClick={() => setInfoModalOpen(true)}
                      className="hover:text-amber-600 transition-colors font-medium flex items-center gap-1.5 cursor-pointer"
                    >
                      <Info size={15} /> Quy định & Thông tin phiên bản
                    </button>
                  </li>
                  <li>
                    <Link
                      href="/accounts"
                      className="hover:text-amber-600 transition-colors font-medium"
                    >
                      Quản lý tài khoản & Phân quyền
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            <div className="text-center text-xs text-slate-500 border-t border-slate-200/70 pt-4">
              © 2026 Coffee Chill POS • Hệ thống quản lý quán cà phê TKQ_Cafe
            </div>
          </footer>

          <RevenueDetailModal
            isOpen={revenueModalOpen}
            onClose={() => setRevenueModalOpen(false)}
          />

          {infoModalOpen && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-lg font-bold text-slate-800">Thông tin hệ thống</h3>
                  <button
                    type="button"
                    onClick={() => setInfoModalOpen(false)}
                    aria-label="Đóng"
                    className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="space-y-2 text-sm text-slate-600">
                  <p>
                    <span className="font-semibold text-slate-800">Phiên bản:</span> Coffee Chill
                    POS v2.0 (HttpOnly JWT + RBAC 3 vai trò)
                  </p>
                  <p>
                    <span className="font-semibold text-slate-800">Vai trò hỗ trợ:</span> ADMIN,
                    MANAGER, EMPLOYEE
                  </p>
                  <p>
                    <span className="font-semibold text-slate-800">Thanh toán:</span> Tiền mặt
                    (CASH) và Chuyển khoản (BANKING) đồng bộ bảng Payment.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setInfoModalOpen(false)}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-xl cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({ title, value, subtitle, icon: Icon, color, bg, href, onClick }: StatCardProps) {
  const baseClasses =
    "h-full w-full bg-white p-5 rounded-2xl border border-slate-100 flex items-center gap-4 transition-all duration-300";
  const interactiveClasses =
    href || onClick
      ? "hover:-translate-y-1 hover:shadow-lg hover:border-amber-200 cursor-pointer"
      : "shadow-sm hover:shadow-md";
  const finalClasses = `${baseClasses} ${interactiveClasses}`;

  const innerContent = (
    <>
      <div
        className={`w-13 h-13 shrink-0 rounded-xl flex items-center justify-center ${bg} ${color}`}
      >
        <Icon size={26} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{title}</p>
        <h4 className="text-2xl font-bold text-slate-800 mt-0.5 truncate">{value}</h4>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5 truncate">{subtitle}</p>}
      </div>
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${finalClasses} text-left`}>
        {innerContent}
      </button>
    );
  }

  if (href) {
    return (
      <Link href={href} className={finalClasses}>
        {innerContent}
      </Link>
    );
  }

  return <div className={finalClasses}>{innerContent}</div>;
}
