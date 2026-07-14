"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuthStore } from "@/store/authStore";
import { loginSchema, type LoginFormValues } from "@/utils/validation";

export function LoginForm() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "owner@apotek.local",
      password: "password"
    }
  });

  async function onSubmit(values: LoginFormValues) {
    try {
      await login(values);
      toast.success("Login berhasil");
      router.push("/dashboard");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Login gagal");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="relative">
        <Mail className="pointer-events-none absolute left-3 top-9 h-4 w-4 text-slate-400" />
        <Input
          label="Email"
          type="email"
          className="pl-9"
          error={errors.email?.message}
          {...register("email")}
        />
      </div>
      <div className="relative">
        <Lock className="pointer-events-none absolute left-3 top-9 h-4 w-4 text-slate-400" />
        <Input
          label="Password"
          type="password"
          className="pl-9"
          error={errors.password?.message}
          {...register("password")}
        />
      </div>
      <Button type="submit" className="w-full" isLoading={isLoading}>
        Masuk Dashboard
      </Button>
    </form>
  );
}
