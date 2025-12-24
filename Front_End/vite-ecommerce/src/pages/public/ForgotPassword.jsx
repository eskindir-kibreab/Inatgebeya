import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, ArrowLeft } from "lucide-react";
import { authAPI } from "../../api/auth.api";
import Input from "../../components/forms/Input";
import Button from "../../components/forms/Button";
import toast from "react-hot-toast";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.forgotPassword({ email });
      if (response.success) {
        setEmailSent(true);
        toast.success("OTP sent to your email!");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    try {
      const response = await authAPI.resendOTP({ email });
      if (response.success) {
        toast.success("New OTP sent to your email!");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div
              className="inline-flex items-center justify-center w-16 h-16 
                         bg-green-100 dark:bg-green-900/20 rounded-full mb-4"
            >
              <Mail className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-3xl font-bold text-text-main dark:text-gray-200">
              Check Your Email
            </h1>
            <p className="text-text-secondary dark:text-gray-400 mt-2">
              We've sent an OTP to <strong>{email}</strong>
            </p>
          </div>

          <div
            className="bg-white dark:bg-gray-800 rounded-xl border border-border-default 
                         dark:border-gray-700 p-8"
          >
            <div className="space-y-4">
              <div
                className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 
                           dark:border-blue-800 rounded-lg"
              >
                <p className="text-sm text-blue-700 dark:text-blue-400 text-center">
                  The OTP is valid for 10 minutes. Check your spam folder if you
                  don't see it.
                </p>
              </div>

              <div className="space-y-4">
                <Button
                  onClick={() => navigate("/verify-otp", { state: { email } })}
                  className="w-full"
                >
                  Enter OTP
                </Button>

                <button
                  onClick={handleResendOTP}
                  disabled={loading}
                  className="w-full py-3 border border-border-default dark:border-gray-700 
                           rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 
                           disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Sending..." : "Resend OTP"}
                </button>

                <button
                  onClick={() => setEmailSent(false)}
                  className="w-full py-3 text-primary hover:text-primary-hover font-medium"
                >
                  Use different email
                </button>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-text-secondary 
                       dark:text-gray-400 hover:text-text-main dark:hover:text-gray-200"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 
                         bg-primary/10 rounded-full mb-4"
          >
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-text-main dark:text-gray-200">
            Forgot Password
          </h1>
          <p className="text-text-secondary dark:text-gray-400 mt-2">
            Enter your email to receive a password reset OTP
          </p>
        </div>

        <div
          className="bg-white dark:bg-gray-800 rounded-xl border border-border-default 
                       dark:border-gray-700 p-8"
        >
          <form onSubmit={handleSubmit}>
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              icon={Mail}
              className="mb-6"
            />

            <Button type="submit" loading={loading} fullWidth>
              Send Reset OTP
            </Button>
          </form>

          <div className="mt-6 p-4 bg-bg-light dark:bg-gray-700 rounded-lg">
            <h3 className="font-medium text-text-main dark:text-gray-200 mb-2">
              Need help?
            </h3>
            <p className="text-sm text-text-secondary dark:text-gray-400">
              If you don't receive an email within a few minutes, check your
              spam folder or contact support.
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-text-secondary 
                     dark:text-gray-400 hover:text-text-main dark:hover:text-gray-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
