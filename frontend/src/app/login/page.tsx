"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, Coffee, KeyRound, Loader2, ShieldCheck, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ApiError, apiClient } from "@/lib/api-client";
import {
  type ForgotPasswordValues,
  forgotPasswordSchema,
  type LoginFormValues,
  loginSchema,
  type RegisterFormValues,
  type ResetPasswordValues,
  registerSchema,
  resetPasswordSchema,
} from "@/schemas/auth.schema";
import { useAuthStore } from "@/stores/useAuthStore";

interface AuthSessionResponse {
  username: string;
  role: string;
}

export default function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<"request" | "reset">("request");
  const [forgotMessage, setForgotMessage] = useState("");
  const [forgotError, setForgotError] = useState("");

  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const allowSelfRegister = process.env.NEXT_PUBLIC_ALLOW_SELF_REGISTER !== "false";

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: "", password: "", confirmPassword: "" },
  });

  const forgotForm = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { identifier: "" },
  });

  const resetForm = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { username: "", resetCode: "", newPassword: "" },
  });

  const redirectAfterLogin = (role: string) => {
    if (role === "EMPLOYEE" || role === "STAFF") {
      router.push("/orders");
    } else {
      router.push("/dashboard");
    }
  };

  const loginMutation = useMutation({
    mutationFn: (data: LoginFormValues) => apiClient.post<AuthSessionResponse>("/auth/login", data),
    onSuccess: (res) => {
      setAuth({ username: res.username, role: res.role });
      redirectAfterLogin(res.role);
    },
    onError: (err) => {
      setSuccessMessage("");
      if (err instanceof ApiError) {
        setServerError(err.message || "Tài khoản hoặc mật khẩu không chính xác");
      } else {
        setServerError("Đăng nhập thất bại. Vui lòng thử lại sau.");
      }
    },
  });

  const registerMutation = useMutation({
    mutationFn: (data: RegisterFormValues) =>
      apiClient.post<{ message: string }>("/auth/register", {
        username: data.username,
        password: data.password,
      }),
    onSuccess: (res) => {
      setIsRegistering(false);
      registerForm.reset();
      setServerError("");
      setSuccessMessage(res.message || "Đăng ký thành công! Vui lòng đăng nhập.");
    },
    onError: (err) => {
      setSuccessMessage("");
      if (err instanceof ApiError) {
        setServerError(err.message || "Đăng ký thất bại. Tên đăng nhập có thể đã tồn tại.");
      } else {
        setServerError("Đăng ký thất bại. Vui lòng thử lại.");
      }
    },
  });

  const googleMutation = useMutation({
    mutationFn: (idToken: string) =>
      apiClient.post<AuthSessionResponse>("/auth/google", { idToken }),
    onSuccess: (res) => {
      setAuth({ username: res.username, role: res.role });
      redirectAfterLogin(res.role);
    },
    onError: (err) => {
      setSuccessMessage("");
      if (err instanceof ApiError) {
        setServerError(err.message || "Đăng nhập bằng Google thất bại");
      } else {
        setServerError("Đăng nhập bằng Google thất bại. Vui lòng thử lại.");
      }
    },
  });

  const forgotMutation = useMutation({
    mutationFn: (data: ForgotPasswordValues) =>
      apiClient.post<{ message: string }>("/auth/forgot-password", data),
    onSuccess: (res, vars) => {
      setForgotError("");
      setForgotMessage(res.message);
      resetForm.setValue("username", vars.identifier);
    },
    onError: (err) => {
      setForgotMessage("");
      setForgotError(
        err instanceof ApiError ? err.message : "Không thể gửi yêu cầu khôi phục mật khẩu",
      );
    },
  });

  const resetMutation = useMutation({
    mutationFn: (data: ResetPasswordValues) =>
      apiClient.post<{ message: string }>("/auth/reset-password", data),
    onSuccess: (res) => {
      setForgotModalOpen(false);
      setForgotStep("request");
      forgotForm.reset();
      resetForm.reset();
      setServerError("");
      setSuccessMessage(res.message || "Đặt lại mật khẩu thành công. Vui lòng đăng nhập.");
    },
    onError: (err) => {
      setForgotMessage("");
      setForgotError(err instanceof ApiError ? err.message : "Không thể đặt lại mật khẩu");
    },
  });

  const isLoading =
    loginMutation.isPending || registerMutation.isPending || googleMutation.isPending;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-amber-500/10 blur-[120px]" />
        <div className="absolute top-[60%] right-[0%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[120px]" />
      </div>

      <Card className="w-full max-w-md relative z-10 border-white/20 bg-white/10 backdrop-blur-xl">
        <CardHeader className="flex flex-col items-center mb-2 text-center pb-4">
          <div className="bg-amber-500 p-3 rounded-2xl text-slate-900 shadow-lg shadow-amber-500/30 mb-3">
            <Coffee size={32} />
          </div>
          <CardTitle className="text-3xl font-bold text-white tracking-wide">
            Coffee Chill
          </CardTitle>
          <CardDescription className="text-slate-400 mt-1 text-sm">
            Hệ thống quản lý thông minh • Phiên bảo mật HttpOnly
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {serverError && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-xl text-sm text-center animate-in fade-in">
              {serverError}
            </div>
          )}

          {successMessage && (
            <div className="bg-emerald-500/20 border border-emerald-500/50 text-emerald-200 p-3 rounded-xl text-sm text-center flex items-center justify-center gap-2 animate-in fade-in">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <div className="flex gap-4 border-b border-white/10 pb-2">
            <button
              type="button"
              className={`flex-1 font-bold py-2 transition-colors cursor-pointer ${
                !isRegistering
                  ? "text-amber-500 border-b-2 border-amber-500"
                  : "text-slate-400 hover:text-white"
              }`}
              onClick={() => {
                setIsRegistering(false);
                setServerError("");
              }}
            >
              Đăng Nhập
            </button>
            <button
              type="button"
              className={`flex-1 font-bold py-2 transition-colors cursor-pointer ${
                isRegistering
                  ? "text-amber-500 border-b-2 border-amber-500"
                  : "text-slate-400 hover:text-white"
              }`}
              onClick={() => {
                setIsRegistering(true);
                setServerError("");
                setSuccessMessage("");
              }}
            >
              Đăng Ký
            </button>
          </div>

          {!isRegistering ? (
            <form
              onSubmit={loginForm.handleSubmit((v) => {
                setServerError("");
                setSuccessMessage("");
                loginMutation.mutate(v);
              })}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">
                  Tên đăng nhập
                </label>
                <Input
                  placeholder="Nhập tên đăng nhập"
                  {...loginForm.register("username")}
                  error={loginForm.formState.errors.username?.message}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5 ml-1">
                  <label className="block text-sm font-medium text-slate-300">Mật khẩu</label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotError("");
                      setForgotMessage("");
                      setForgotStep("request");
                      setForgotModalOpen(true);
                    }}
                    className="text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                  >
                    Quên mật khẩu?
                  </button>
                </div>
                <Input
                  type="password"
                  placeholder="••••••••"
                  {...loginForm.register("password")}
                  error={loginForm.formState.errors.password?.message}
                />
              </div>

              <Button type="submit" disabled={isLoading} className="w-full mt-2" size="lg">
                {isLoading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  "Đăng nhập vào hệ thống"
                )}
              </Button>
            </form>
          ) : allowSelfRegister ? (
            <form
              onSubmit={registerForm.handleSubmit((v) => {
                setServerError("");
                registerMutation.mutate(v);
              })}
              className="space-y-4"
            >
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-200 flex items-start gap-2">
                <ShieldCheck size={16} className="shrink-0 mt-0.5 text-amber-400" />
                <div>
                  <p className="font-semibold text-amber-300">Chính sách tài khoản mới:</p>
                  <p className="mt-0.5 text-slate-300">
                    Mật khẩu tối thiểu 8 ký tự (có chữ và số). Tài khoản tự đăng ký được cấp quyền{" "}
                    <span className="font-semibold text-white">EMPLOYEE</span>.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">
                  Tên đăng nhập
                </label>
                <Input
                  placeholder="Nhập tên đăng nhập mới"
                  {...registerForm.register("username")}
                  error={registerForm.formState.errors.username?.message}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">
                  Mật khẩu
                </label>
                <Input
                  type="password"
                  placeholder="Tối thiểu 8 ký tự, gồm chữ và số"
                  {...registerForm.register("password")}
                  error={registerForm.formState.errors.password?.message}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">
                  Xác nhận mật khẩu
                </label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  {...registerForm.register("confirmPassword")}
                  error={registerForm.formState.errors.confirmPassword?.message}
                />
              </div>

              <Button type="submit" disabled={isLoading} className="w-full mt-2" size="lg">
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : "Đăng ký tài khoản"}
              </Button>
            </form>
          ) : (
            <div className="bg-slate-800/80 border border-white/10 rounded-xl p-4 text-sm text-slate-300 space-y-2 text-center">
              <ShieldCheck size={28} className="mx-auto text-amber-400" />
              <p className="font-semibold text-white">Đăng ký nội bộ theo chính sách quán</p>
              <p className="text-xs text-slate-400">
                Hệ thống hiện chỉ cho phép Quản trị viên cấp tài khoản nhân viên mới. Vui lòng liên
                hệ Quản lý hoặc Admin để được cấp quyền truy cập.
              </p>
            </div>
          )}

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-800/90 px-3 py-0.5 text-slate-400 font-medium rounded-full border border-white/5">
                Hoặc tiếp tục với
              </span>
            </div>
          </div>

          <GoogleSignInButton
            onSuccess={(idToken) => {
              setServerError("");
              googleMutation.mutate(idToken);
            }}
            onError={(msg) => setServerError(msg)}
            disabled={isLoading}
          />
        </CardContent>
      </Card>

      {/* Modal Quên mật khẩu */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-white/15 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-amber-400">
                <KeyRound size={20} />
                <h3 className="font-bold text-white text-lg">Khôi phục mật khẩu</h3>
              </div>
              <button
                type="button"
                onClick={() => setForgotModalOpen(false)}
                aria-label="Đóng"
                className="text-slate-400 hover:text-white p-1.5 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex gap-2 bg-slate-800 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setForgotStep("request");
                  setForgotError("");
                }}
                className={`flex-1 py-2 rounded-lg transition-colors cursor-pointer ${
                  forgotStep === "request"
                    ? "bg-amber-500 text-slate-900"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                1. Gửi yêu cầu
              </button>
              <button
                type="button"
                onClick={() => {
                  setForgotStep("reset");
                  setForgotError("");
                }}
                className={`flex-1 py-2 rounded-lg transition-colors cursor-pointer ${
                  forgotStep === "reset"
                    ? "bg-amber-500 text-slate-900"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                2. Nhập mã đặt lại
              </button>
            </div>

            {forgotError && (
              <div className="bg-red-500/20 border border-red-500/40 text-red-200 p-3 rounded-xl text-xs">
                {forgotError}
              </div>
            )}
            {forgotMessage && (
              <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 p-3 rounded-xl text-xs leading-relaxed">
                {forgotMessage}
              </div>
            )}

            {forgotStep === "request" ? (
              <form
                onSubmit={forgotForm.handleSubmit((v) => forgotMutation.mutate(v))}
                className="space-y-3"
              >
                <p className="text-xs text-slate-400">
                  Nhập tên đăng nhập hoặc email liên kết để ghi nhận yêu cầu cấp lại mật khẩu.
                </p>
                <Input
                  placeholder="Tên đăng nhập hoặc email..."
                  {...forgotForm.register("identifier")}
                  error={forgotForm.formState.errors.identifier?.message}
                />
                <Button type="submit" disabled={forgotMutation.isPending} className="w-full">
                  {forgotMutation.isPending ? "Đang gửi..." : "Gửi yêu cầu khôi phục"}
                </Button>
              </form>
            ) : (
              <form
                onSubmit={resetForm.handleSubmit((v) => resetMutation.mutate(v))}
                className="space-y-3"
              >
                <Input
                  placeholder="Tên đăng nhập"
                  {...resetForm.register("username")}
                  error={resetForm.formState.errors.username?.message}
                />
                <Input
                  placeholder="Mã xác nhận (6 chữ số)"
                  {...resetForm.register("resetCode")}
                  error={resetForm.formState.errors.resetCode?.message}
                />
                <Input
                  type="password"
                  placeholder="Mật khẩu mới (≥ 8 ký tự, chữ & số)"
                  {...resetForm.register("newPassword")}
                  error={resetForm.formState.errors.newPassword?.message}
                />
                <Button type="submit" disabled={resetMutation.isPending} className="w-full">
                  {resetMutation.isPending ? "Đang cập nhật..." : "Đặt lại mật khẩu"}
                </Button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
