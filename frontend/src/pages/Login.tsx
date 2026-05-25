import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import secureApi from "../api/secureApi";
import { loginSchema } from "../validators/auth";
import { useAuthStore } from "../stores/auth.store";

type LoginForm = {
  email: string;
  password: string;
};

export const Login = () => {
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginForm) => {
    try {
      const response = await secureApi.post<{ user: { id: string; email: string; role: string }; accessToken: string }>(
        "/api/auth/login",
        values,
      );
      setUser(response.user);
      setAccessToken(response.accessToken);
      navigate("/dashboard");
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? (error.response?.data as { message?: string } | undefined)?.message || "Unable to sign in"
        : "Unable to sign in";
      setErrorMessage(message);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-100 px-4 py-10">
      <section className="w-full max-w-md rounded-3xl bg-white p-8 shadow-md">
        <h1 className="text-3xl font-semibold text-slate-900">Sign in</h1>
        <p className="mt-2 text-slate-500">Access your OMS platform securely.</p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)}>
          {errorMessage && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          )}
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Email</span>
            <input className="mt-2 w-full rounded-2xl border px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-600" {...register("email")} />
            {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>}
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Password</span>
            <input type="password" className="mt-2 w-full rounded-2xl border px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-600" {...register("password")} />
            {errors.password && <p className="mt-2 text-sm text-red-600">{errors.password.message}</p>}
          </label>

          <button type="submit" disabled={isSubmitting} className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50">
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-500">
          New to OMS? <Link className="text-slate-950 font-semibold hover:underline" to="/register">Create an account</Link>
        </p>
      </section>
    </main>
  );
};
