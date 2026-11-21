import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Mail,
  ShieldCheck,
  UserRound,
  GraduationCap,
  Users,
  Sparkles,
} from "lucide-react";
import { authClient } from "../../../lib/authClient";
import Swal, { showAlert } from "../../../lib/alerts";

const Register = () => {
  const navigate = useNavigate();

  // Role: "Student" | "Member" | "Admin"
  const [role, setRole] = useState("Student");

  // Standard Account Fields (Same across Student, Member, Admin)
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      setError("Passwords don't match. Please check and try again.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const payload = {
        name: name.trim(),
        email: email.trim(),
        password,
        role,
      };

      const { error: signUpError } = await authClient.signUp.email(payload);

      if (signUpError) {
        setError(signUpError.message);
        showAlert.error("Registration Failed", signUpError.message || "Could not complete account registration.");
        return;
      }

      await Swal.fire({
        icon: "success",
        title: "Account Created!",
        text: `Welcome to UnityGrid! Your account has been registered as ${role}.`,
        confirmButtonText: "Get Started",
        confirmButtonColor: "#173b69",
        customClass: {
          popup: "rounded-3xl shadow-2xl p-6 font-sans",
          title: "text-lg font-black text-slate-800",
          htmlContainer: "text-xs text-slate-600 leading-relaxed",
          confirmButton: "rounded-xl px-5 py-2.5 text-xs font-bold shadow-md",
        },
      });

      // Role-based redirect on successful registration
      if (role === "Admin") {
        navigate("/departments", { replace: true });
      } else {
        // Students and members are taken to Blood Network where they can register as donor via Campus Donation form if desired
        navigate("/blood", { replace: true });
      }
    } catch (requestError) {
      const msg =
        requestError instanceof Error
          ? requestError.message
          : "Unable to create your account. Please try again.";
      setError(msg);
      showAlert.error("Registration Error", msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearError = () => setError("");

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-3 sm:p-6 lg:p-8">
      <div className="w-full max-w-[1040px] bg-base-100 rounded-3xl shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-12 border border-slate-200/80">
        {/* LEFT BRANDING PANEL */}
        <div className="md:col-span-5 hidden md:flex flex-col justify-between p-8 lg:p-9 text-white bg-gradient-to-br from-[#101b33] via-[#173b69] to-[#040d15]">
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shadow-md">
              <ShieldCheck size={28} />
            </div>
            <div>
              <h2 className="text-xl font-black">UnityGrid</h2>
              <p className="text-[10px] tracking-wider text-blue-200 font-bold uppercase">
                Campus & Community Network
              </p>
            </div>
          </div>

          <div className="space-y-6 my-auto py-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-bold backdrop-blur-xs">
              <Sparkles size={13} className="text-amber-400" />
              <span>
                {role === "Student" && "Campus Student Portal"}
                {role === "Member" && "Club & Committee Network"}
                {role === "Admin" && "Academic Administration"}
              </span>
            </div>

            <h1 className="text-2xl lg:text-3xl font-black leading-tight tracking-tight">
              Stronger campus collaboration starts here.
            </h1>

            <div className="space-y-3.5 text-xs text-blue-100 leading-relaxed">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={17} className="text-emerald-400 shrink-0" />
                <p>Real-time donor matching with 90-day cooldown logistics</p>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 size={17} className="text-emerald-400 shrink-0" />
                <p>Academic departments, student clubs, and event management</p>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 size={17} className="text-emerald-400 shrink-0" />
                <p>Emergency flood & crisis response hub with transparent ledger</p>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-blue-300">
            Connected · Community-led · Ready to help
          </p>
        </div>

        {/* RIGHT REGISTRATION FORM */}
        <div className="md:col-span-7 flex flex-col justify-center p-6 sm:p-8 lg:p-10 max-h-[92vh] overflow-y-auto">
          <div className="w-full max-w-[480px] mx-auto">
            <div className="mb-5">
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-800">
                Join UnityGrid
              </h2>
              <p className="text-slate-500 mt-1 text-xs">
                Select your campus role to configure your account.
              </p>
            </div>

            {/* ──────────────── ROLE SELECTOR (3 OPTIONS) ──────────────── */}
            <div className="mb-5">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                I am registering as:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {/* 1. Student */}
                <button
                  type="button"
                  onClick={() => {
                    setRole("Student");
                    clearError();
                  }}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border text-center transition ${
                    role === "Student"
                      ? "border-[#173b69] bg-blue-50/70 text-[#173b69] ring-2 ring-[#173b69]/10 font-bold"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <GraduationCap size={20} className={role === "Student" ? "text-[#173b69]" : "text-slate-400"} />
                  <span className="text-xs font-bold mt-1">Student</span>
                  <span className="text-[9px] text-slate-400 mt-0.5">Campus Donor</span>
                </button>

                {/* 2. Member */}
                <button
                  type="button"
                  onClick={() => {
                    setRole("Member");
                    clearError();
                  }}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border text-center transition ${
                    role === "Member"
                      ? "border-purple-600 bg-purple-50/70 text-purple-800 ring-2 ring-purple-600/10 font-bold"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Users size={20} className={role === "Member" ? "text-purple-700" : "text-slate-400"} />
                  <span className="text-xs font-bold mt-1">Member</span>
                  <span className="text-[9px] text-slate-400 mt-0.5">Club Lead</span>
                </button>

                {/* 3. Admin */}
                <button
                  type="button"
                  onClick={() => {
                    setRole("Admin");
                    clearError();
                  }}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border text-center transition ${
                    role === "Admin"
                      ? "border-red-600 bg-red-50/70 text-red-800 ring-2 ring-red-600/10 font-bold"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <ShieldCheck size={20} className={role === "Admin" ? "text-red-700" : "text-slate-400"} />
                  <span className="text-xs font-bold mt-1">Admin</span>
                  <span className="text-[9px] text-slate-400 mt-0.5">Supervisor</span>
                </button>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="border border-red-200 bg-red-50 rounded-2xl px-4 py-3 mb-4 text-xs font-semibold text-red-700"
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="register-name">
                  Full Name *
                </label>
                <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-xl px-3.5 h-11 focus-within:border-[#173b69] focus-within:bg-white transition">
                  <UserRound size={16} className="text-slate-400" />
                  <input
                    id="register-name"
                    type="text"
                    placeholder="e.g. Shaheenur Rashid"
                    className="w-full bg-transparent outline-none text-xs text-slate-900 placeholder:text-slate-400"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      clearError();
                    }}
                    autoComplete="name"
                    required
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="register-email">
                  Email Address *
                </label>
                <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-xl px-3.5 h-11 focus-within:border-[#173b69] focus-within:bg-white transition">
                  <Mail size={16} className="text-slate-400" />
                  <input
                    id="register-email"
                    type="email"
                    placeholder="e.g. student@university.edu"
                    className="w-full bg-transparent outline-none text-xs text-slate-900 placeholder:text-slate-400"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      clearError();
                    }}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              {/* Password & Confirm Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="register-password">
                    Password *
                  </label>
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 h-11 focus-within:border-[#173b69] focus-within:bg-white transition">
                    <input
                      id="register-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Min. 8 characters"
                      className="w-full bg-transparent outline-none text-xs text-slate-900 placeholder:text-slate-400"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        clearError();
                      }}
                      autoComplete="new-password"
                      minLength={8}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-400 hover:text-slate-700"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="register-confirm-password">
                    Confirm Password *
                  </label>
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 h-11 focus-within:border-[#173b69] focus-within:bg-white transition">
                    <input
                      id="register-confirm-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Re-enter password"
                      className="w-full bg-transparent outline-none text-xs text-slate-900 placeholder:text-slate-400"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        clearError();
                      }}
                      autoComplete="new-password"
                      minLength={8}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full h-11 rounded-xl text-xs font-black text-white shadow-md transition-all mt-2 ${
                  role === "Admin"
                    ? "bg-[#173b69] hover:bg-[#122e53]"
                    : role === "Member"
                    ? "bg-purple-700 hover:bg-purple-800"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {isSubmitting
                  ? "Creating Account..."
                  : `Create ${role} Account`}
              </button>
            </form>

            <div className="divider my-4 text-[10px] text-slate-400">OR</div>

            <p className="text-center text-xs text-slate-500">
              Already have an account?{" "}
              <Link to="/login" className="text-[#173b69] font-bold hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
