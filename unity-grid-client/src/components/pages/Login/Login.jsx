import { useState, useEffect } from "react";
import { FcGoogle } from "react-icons/fc";
import { Link, useNavigate, useLocation } from "react-router-dom";

import { ShieldCheck, Mail, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { authClient } from "../../../lib/authClient";
import { useCurrentUser } from "../../../lib/useCurrentUser";
import Swal, { showAlert } from "../../../lib/alerts";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin, loading: authLoading } = useCurrentUser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [departmentLogin, setDepartmentLogin] = useState(false);

  useEffect(() => {
    if (!authLoading && user && isAdmin) {
      navigate("/dashboard/admin", { replace: true });
    }
  }, [authLoading, user, isAdmin, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const { error: signInError } = await authClient.signIn.email({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        showAlert.error("Sign In Failed", signInError.message || "Invalid email or password.");
        return;
      }

      await Swal.fire({
        icon: "success",
        title: "Login Successful!",
        text: "Welcome back to UnityGrid.",
        timer: 1500,
        showConfirmButton: false,
        customClass: {
          popup: "rounded-3xl shadow-2xl p-6 font-sans",
          title: "text-lg font-black text-slate-800",
          htmlContainer: "text-xs text-slate-600 leading-relaxed",
        },
      });

      // If user is Admin -> redirect directly to /departments
      try {
        const meRes = await fetch(`${API_BASE}/api/me`, { credentials: "include" });
        const meData = await meRes.json();
        if (meData?.user?.role === "Department") {
          navigate("/dashboard/department", { replace: true });
          return;
        }
        if (departmentLogin) {
          await authClient.signOut();
          setError("This account is not a department account.");
          return;
        }
        if (meData?.user?.role === "Admin") {
          navigate("/dashboard/admin", { replace: true });
          return;
        }
      } catch {
        if (departmentLogin) {
          await authClient.signOut();
          setError("Could not verify the department account. Please try again.");
          return;
        }
      }

      const redirectTarget = location.state?.from || "/";
      navigate(redirectTarget, { replace: true });
    } catch (requestError) {
      const errMsg =
        requestError instanceof Error
          ? requestError.message
          : "Unable to sign in. Please try again.";
      setError(errMsg);
      showAlert.error("Sign In Error", errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-[960px] md:min-h-[560px] bg-base-100 rounded-2xl shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
        {/* LEFT SIDE */}
        <div className="hidden md:flex flex-col justify-between p-8 lg:p-9 text-white bg-gradient-to-br from-[#2d6793] to-[#040d15]">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-13 h-13 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center">
              <ShieldCheck size={30} />
            </div>

            <div>
              <h2 className="text-2xl font-bold">UnityGrid</h2>
              <p className="text-xs tracking-wide text-blue-100">
                COMMUNITY RESPONSE NETWORK
              </p>
            </div>
          </div>

          {/* Branding Content */}
          <div className="space-y-6">
            <h1 className="text-3xl lg:text-4xl font-extrabold leading-tight tracking-tight">
              Stronger communities start here.
              <br />
              <span className="text-blue-200">One grid. Ready to help.</span>
            </h1>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={19} />
                <p className="text-[15px]">
                  Find blood donors and support urgent requests
                </p>
              </div>

              <div className="flex items-center gap-3">
                <CheckCircle2 size={19} />
                <p className="text-[15px]">
                  Connect campus clubs, volunteers, and relief teams
                </p>
              </div>

              <div className="flex items-center gap-3">
                <CheckCircle2 size={19} />
                <p className="text-[15px]">
                  Coordinate community response when it matters most
                </p>
              </div>
            </div>
          </div>

          <p className="text-sm text-blue-200">
            Connected · Community-led · Ready to help
          </p>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center justify-center p-6 sm:p-8 lg:p-10">
          <div className="w-full max-w-[440px]">
            {/* Heading */}
            <div className="mb-7">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-base-content">
                Welcome to UnityGrid
              </h1>

              <p className="text-base-content/60 mt-3 text-sm sm:text-base">
                Sign in to connect with your campus and community.
              </p>
            </div>

            {/* Notice / Message */}
            {location.state?.message && (
              <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs font-semibold text-[#173b69] flex items-center gap-2">
                <ShieldCheck size={18} className="text-[#173b69] shrink-0" />
                <span>{location.state.message}</span>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div
                role="alert"
                className="border border-base-300 shadow-sm rounded-xl px-5 py-4 mb-4"
              >
                <p className="text-red-500 text-sm">{error}</p>
              </div>
            )}

            {/* Form */}
            <div className="flex gap-2 mb-5">
              <button type="button" onClick={() => setDepartmentLogin(false)} className={`flex-1 rounded-xl border p-3 text-sm font-bold ${!departmentLogin ? "bg-[#173b69] text-white" : "bg-white"}`}>User login</button>
              <button type="button" onClick={() => setDepartmentLogin(true)} className={`flex-1 rounded-xl border p-3 text-sm font-bold ${departmentLogin ? "bg-[#173b69] text-white" : "bg-white"}`}>Department login</button>
            </div>
            <form onSubmit={handleSubmit}>
              {/* Email */}
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text font-semibold text-base-content">
                    Email
                  </span>
                </label>

                <div className="flex items-center gap-3 bg-[#e7f0ff] border border-base-300 rounded-xl px-4 h-12 shadow-sm focus-within:border-blue-500">
                  <Mail size={19} className="text-gray-500" />

                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="w-full bg-transparent outline-none text-sm text-gray-900 placeholder:text-gray-400"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold text-base-content">
                    Password
                  </span>
                </label>

                <div className="flex items-center gap-3 bg-[#e7f0ff] border border-base-300 rounded-xl px-4 h-12 shadow-sm focus-within:border-blue-500">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="w-full bg-transparent outline-none text-sm text-gray-900 placeholder:text-gray-400"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                    autoComplete="current-password"
                    required
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-500 hover:text-gray-800"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Forgot Password */}
              <div className="flex justify-end mt-3 mb-5">
                <a
                  href="mailto:hello@unitygrid.example"
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  Need help signing in?
                </a>
              </div>

              {/* Sign In */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn w-full h-12 min-h-12 rounded-xl border-0 bg-gradient-to-r from-[#2d6793] to-[#040d15] text-base font-semibold text-white shadow-lg transition-opacity hover:opacity-90"
              >
                {isSubmitting ? "Signing in..." : "Sign in"}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-5">
              <div className="h-px bg-base-300 flex-1"></div>

              <span className="text-xs text-base-content/60 whitespace-nowrap">
                OR CONTINUE WITH
              </span>

              <div className="h-px bg-base-300 flex-1"></div>
            </div>

            {/* Google */}
            <button
              type="button"
              onClick={() => setError("Google sign-in isn't available yet.")}
              className="btn w-full h-12 min-h-12 rounded-xl border-[#435065]  bg-white hover:bg-black hover:text-white text-base font-medium text-[#34445c]"
            >
              <FcGoogle size={22}/>
              Continue with Google
            </button>

            {/* Bottom Divider */}
            <div className="divider mt-7 mb-5"></div>

            {/* Sign Up */}
            <p className="text-center text-sm text-base-content/60">
              New to UnityGrid?{" "}
              <Link
                to="/register"
                className="text-blue-600 font-semibold hover:underline"
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
