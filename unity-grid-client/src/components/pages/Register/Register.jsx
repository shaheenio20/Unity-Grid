
import { useState } from "react";
import { Link } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      setError("Passwords don't match. Please check and try again.");
      return;
    }

    setError("Account registration isn't available yet. Please check back soon.");
  };

  const clearError = () => setError("");

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-[960px] md:min-h-[560px] bg-base-100 rounded-2xl shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
        <div className="hidden md:flex flex-col justify-between p-8 lg:p-9 text-white bg-gradient-to-br from-[#2d6793] to-[#040d15]">
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

        <div className="flex items-center justify-center p-6 sm:p-8 lg:p-10">
          <div className="w-full max-w-[440px]">
            <div className="mb-6">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-base-content">
                Join UnityGrid
              </h1>
              <p className="text-base-content/60 mt-3 text-sm sm:text-base">
                Create an account to connect with your campus and community.
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="border border-base-300 shadow-sm rounded-xl px-5 py-4 mb-4"
              >
                <p className="text-red-500 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-control mb-3">
                <label className="label" htmlFor="register-name">
                  <span className="label-text font-semibold text-base-content">
                    Full name
                  </span>
                </label>
                <div className="flex items-center gap-3 bg-[#e7f0ff] border border-base-300 rounded-xl px-4 h-12 shadow-sm focus-within:border-blue-500">
                  <UserRound size={18} className="text-gray-500" />
                  <input
                    id="register-name"
                    type="text"
                    placeholder="Enter your full name"
                    className="w-full bg-transparent outline-none text-sm text-gray-900 placeholder:text-gray-400"
                    value={name}
                    onChange={(event) => {
                      setName(event.target.value);
                      clearError();
                    }}
                    autoComplete="name"
                    required
                  />
                </div>
              </div>

              <div className="form-control mb-3">
                <label className="label" htmlFor="register-email">
                  <span className="label-text font-semibold text-base-content">
                    Email
                  </span>
                </label>
                <div className="flex items-center gap-3 bg-[#e7f0ff] border border-base-300 rounded-xl px-4 h-12 shadow-sm focus-within:border-blue-500">
                  <Mail size={18} className="text-gray-500" />
                  <input
                    id="register-email"
                    type="email"
                    placeholder="Enter your email"
                    className="w-full bg-transparent outline-none text-sm text-gray-900 placeholder:text-gray-400"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      clearError();
                    }}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="form-control mb-3">
                <label className="label" htmlFor="register-password">
                  <span className="label-text font-semibold text-base-content">
                    Password
                  </span>
                </label>
                <div className="flex items-center gap-3 bg-[#e7f0ff] border border-base-300 rounded-xl px-4 h-12 shadow-sm focus-within:border-blue-500">
                  <input
                    id="register-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    className="w-full bg-transparent outline-none text-sm text-gray-900 placeholder:text-gray-400"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      clearError();
                    }}
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-500 hover:text-gray-800"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="form-control mb-5">
                <label className="label" htmlFor="register-confirm-password">
                  <span className="label-text font-semibold text-base-content">
                    Confirm password
                  </span>
                </label>
                <div className="flex items-center gap-3 bg-[#e7f0ff] border border-base-300 rounded-xl px-4 h-12 shadow-sm focus-within:border-blue-500">
                  <input
                    id="register-confirm-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Re-enter your password"
                    className="w-full bg-transparent outline-none text-sm text-gray-900 placeholder:text-gray-400"
                    value={confirmPassword}
                    onChange={(event) => {
                      setConfirmPassword(event.target.value);
                      clearError();
                    }}
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn w-full h-12 min-h-12 rounded-xl border-0 bg-gradient-to-r from-[#2d6793] to-[#040d15] text-base font-semibold text-white shadow-lg transition-opacity hover:opacity-90"
              >
                Create account
              </button>
            </form>

            <div className="flex items-center gap-3 my-5">
              <div className="h-px bg-base-300 flex-1"></div>
              <span className="text-xs text-base-content/60 whitespace-nowrap">
                OR CONTINUE WITH
              </span>
              <div className="h-px bg-base-300 flex-1"></div>
            </div>

            <button
              type="button"
              onClick={() =>
                setError("Google sign-up isn't available yet.")
              }
              className="btn w-full h-12 min-h-12 rounded-xl border border-[#435065]  bg-white hover:bg-black hover:text-white text-base font-medium text-[#34445c]"
            >
              <FcGoogle size={22} />
              Continue with Google
            </button>

            <div className="divider mt-6 mb-4"></div>
            <p className="text-center text-sm text-base-content/60">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-blue-600 font-semibold hover:underline"
              >
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