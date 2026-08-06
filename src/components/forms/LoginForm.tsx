"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuthStore } from "@/store/authStore";
import { loginSchema, type LoginFormValues } from "@/utils/validation";

export function LoginForm() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  });

  async function onSubmit(values: LoginFormValues) {
    try {
      const user = await login(values);
      toast.success("Login berhasil");
      router.push(user.role === "kasir" ? "/penjualan/kasir" : "/dashboard");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Login gagal");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="group relative">
        <Mail className="pointer-events-none absolute left-4 top-[42px] h-4 w-4 text-slate-400 transition group-focus-within:text-brand-700" />
        <Input
          label="Email"
          type="email"
          className="h-12 rounded-2xl border-slate-200 bg-slate-50/80 pl-12 shadow-sm transition group-focus-within:bg-white"
          error={errors.email?.message}
          {...register("email")}
        />
      </div>
      <div className="group relative">
        <Lock className="pointer-events-none absolute left-4 top-[42px] h-4 w-4 text-slate-400 transition group-focus-within:text-brand-700" />
        <Input
          label="Password"
          type={showPassword ? "text" : "password"}
          className="h-12 rounded-2xl border-slate-200 bg-slate-50/80 pl-12 pr-12 shadow-sm transition group-focus-within:bg-white"
          error={errors.password?.message}
          {...register("password")}
        />
        <button
          type="button"
          aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
          onClick={() => setShowPassword((current) => !current)}
          className="absolute right-3 top-[34px] grid h-8 w-8 place-items-center rounded-full text-slate-400 transition hover:bg-brand-50 hover:text-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-100"
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      <Button
        type="submit"
        size="lg"
        className="group h-12 w-full bg-brand-700 shadow-[0_16px_34px_rgba(15,118,110,0.26)] transition hover:-translate-y-0.5 hover:bg-brand-900 active:translate-y-0"
        isLoading={isLoading}
      >
        Masuk Dashboard
        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
      </Button>
    </form>
  );
}
