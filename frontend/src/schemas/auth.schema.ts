import { z } from "zod";

/**
 * Schema Zod xác thực form Đăng nhập
 */
export const loginSchema = z.object({
  username: z
    .string()
    .min(1, "Tên đăng nhập không được để trống")
    .max(50, "Tên đăng nhập không quá 50 ký tự"),
  password: z
    .string()
    .min(1, "Mật khẩu không được để trống")
    .min(4, "Mật khẩu phải có ít nhất 4 ký tự"),
});

/**
 * Schema Zod xác thực form Đăng ký (theo chính sách mật khẩu mạnh)
 */
export const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, "Tên đăng nhập phải có ít nhất 3 ký tự")
      .max(50, "Tên đăng nhập không quá 50 ký tự"),
    password: z
      .string()
      .min(8, "Mật khẩu đăng ký phải có ít nhất 8 ký tự")
      .regex(/[a-zA-Z]/, "Mật khẩu phải chứa ít nhất 1 chữ cái")
      .regex(/[0-9]/, "Mật khẩu phải chứa ít nhất 1 chữ số"),
    confirmPassword: z.string().min(1, "Vui lòng xác nhận mật khẩu"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  identifier: z.string().trim().min(1, "Vui lòng nhập tên đăng nhập hoặc email"),
});

export const resetPasswordSchema = z.object({
  username: z.string().trim().min(1, "Tên đăng nhập không được để trống"),
  resetCode: z.string().trim().length(6, "Mã xác nhận gồm đúng 6 chữ số"),
  newPassword: z
    .string()
    .min(8, "Mật khẩu mới phải có ít nhất 8 ký tự")
    .regex(/[a-zA-Z]/, "Mật khẩu mới phải chứa ít nhất 1 chữ cái")
    .regex(/[0-9]/, "Mật khẩu mới phải chứa ít nhất 1 chữ số"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
