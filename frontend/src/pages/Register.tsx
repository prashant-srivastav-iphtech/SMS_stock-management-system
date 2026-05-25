import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, Link } from "react-router-dom";
import secureApi from "../api/secureApi";
import { registerSchema } from "../validators/auth";

type RegisterForm = {
  firstName: string;
  lastName?: string;
  email: string;
  password: string;
};

export const Register = () => {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (values: RegisterForm) => {
    await secureApi.post("/api/auth/register", values);
    navigate("/login");
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-100 px-4 py-10">
      <section className="w-full max-w-md rounded-3xl bg-white p-8 shadow-md">
        <h1 className="text-3xl font-semibold text-slate-900">Create an account</h1>
        <p className="mt-2 text-slate-500">Register for the secure OMS platform.</p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">First name</span>
            <input className="mt-2 w-full rounded-2xl border px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-600" {...register("firstName")} />
            {errors.firstName && <p className="mt-2 text-sm text-red-600">{errors.firstName.message}</p>}
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Last name</span>
            <input className="mt-2 w-full rounded-2xl border px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-600" {...register("lastName")} />
          </label>

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
            {isSubmitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-500">
          Already have an account? <Link className="text-slate-950 font-semibold hover:underline" to="/login">Sign in</Link>
        </p>
      </section>
    </main>
  );
};
