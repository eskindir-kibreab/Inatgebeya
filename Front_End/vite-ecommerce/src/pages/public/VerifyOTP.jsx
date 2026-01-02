import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Key, ArrowLeft, Clock } from "lucide-react";
import { authAPI } from "../../api/auth.api";
import { useAuth } from "../../context/AuthContext";
import Button from "../../components/forms/Button";
import toast from "react-hot-toast";

const VerifyOTP = () => {
  const { fetchUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState(location.state?.email || "");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [verificationToken, setVerificationToken] = useState(null);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [resendLoading, setResendLoading] = useState(false);

  const inputRefs = useRef([]);

  useEffect(() => {
    // If no email in state, redirect to forgot password
    if (!email) {
      navigate("/forgot-password");
    }
  }, [email, navigate]);

  useEffect(() => {
    // Timer countdown
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handleChange = (index, value) => {
    // Only allow numbers
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits are filled
    if (newOtp.every((digit) => digit !== "") && index === 5) {
      handleVerify();
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    // Handle left arrow
    if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    }

    // Handle right arrow
    if (e.key === "ArrowRight" && index < 5) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").trim();

    // Only accept numbers and exactly 6 digits
    if (/^\d{6}$/.test(pasteData)) {
      const digits = pasteData.split("");
      const newOtp = [...otp];
      digits.forEach((digit, index) => {
        if (index < 6) {
          newOtp[index] = digit;
        }
      });
      setOtp(newOtp);

      // Focus last input
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpCode = otp.join("");

    if (otpCode.length !== 6) {
      toast.error("Please enter the 6-digit OTP");
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.verifyOTP({
        email,
        otp_code: otpCode,
      });

      if (response.success) {
        if (response.type === "registration") {
          // Registration success - log user in
          sessionStorage.setItem("token", response.data.token);
          await fetchUser();
          toast.success("Registration verified and logged in successfully!");
          navigate("/"); // Redirect to landing page
        } else {
          // Password reset success
          setVerificationToken(response.verification_token);
          toast.success("OTP verified successfully!");
          navigate("/reset-password", {
            state: {
              verification_token: response.verification_token,
              email,
            },
          });
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid OTP");
      // Clear OTP on error
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (timeLeft > 0) {
      toast.error(`Please wait ${formatTime(timeLeft)} before resending`);
      return;
    }

    setResendLoading(true);
    try {
      const response = await authAPI.resendOTP({ email });
      if (response.success) {
        setTimeLeft(600); // Reset timer to 10 minutes
        toast.success("New OTP sent to your email!");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to resend OTP");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-white dark:bg-gray-900 overflow-y-auto py-12 px-4 transition-all duration-300">
      <div className="flex items-center justify-center min-h-full">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div
              className="inline-flex items-center justify-center w-16 h-16 
                         bg-primary/10 rounded-full mb-4"
            >
              <Key className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-text-main dark:text-gray-200">
              Enter OTP
            </h1>
            <p className="text-text-secondary dark:text-gray-400 mt-2">
              We sent a 6-digit code to <strong>{email}</strong>
            </p>
          </div>

          <div
            className="bg-white dark:bg-gray-800 rounded-2xl border border-border-default 
                       dark:border-gray-700 p-8 shadow-2xl dark:shadow-black/50"
          >
            {/* Timer */}
            <div className="flex items-center justify-center gap-2 mb-8">
              <Clock className="w-5 h-5 text-text-secondary" />
              <span
                className={`font-medium ${timeLeft < 60 ? "text-red-600 dark:text-red-400" : "text-text-main dark:text-gray-200"
                  }`}
              >
                {formatTime(timeLeft)}
              </span>
              <span className="text-text-secondary dark:text-gray-400">
                remaining
              </span>
            </div>

            {/* OTP Input */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-text-main dark:text-gray-200 mb-4 text-center">
                Enter the 6-digit verification code
              </label>

              <div className="flex justify-center gap-2 sm:gap-3 mb-4">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    className="w-9 h-12 sm:w-12 sm:h-14 text-xl sm:text-2xl text-center border-2 border-border-default 
                           dark:border-gray-700 rounded-lg focus:border-primary 
                           focus:ring-2 focus:ring-primary/20 bg-white
                           text-black
                           disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={loading}
                    autoFocus={index === 0}
                  />
                ))}
              </div>

              <p className="text-center text-sm text-text-secondary dark:text-gray-400">
                Didn't receive the code?{" "}
                <button
                  onClick={handleResendOTP}
                  disabled={resendLoading || timeLeft > 0}
                  className="text-primary hover:text-primary-hover disabled:opacity-50 
                         disabled:cursor-not-allowed"
                >
                  {resendLoading ? "Sending..." : "Resend OTP"}
                </button>
              </p>
            </div>

            <Button
              onClick={handleVerify}
              loading={loading}
              fullWidth
              disabled={otp.join("").length !== 6}
            >
              Verify OTP
            </Button>

            <div className="mt-6 p-4 bg-bg-light dark:bg-gray-700 rounded-lg">
              <h3 className="font-medium text-text-main dark:text-gray-200 mb-2">
                Tips:
              </h3>
              <ul className="text-sm text-text-secondary dark:text-gray-400 space-y-1">
                <li>• Check your spam folder if you don't see the email</li>
                <li>• The code is case-sensitive</li>
                <li>• Code expires in 10 minutes</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 flex flex-col items-center gap-4">
            <Link
              to="/login"
              className="text-sm text-primary hover:text-primary-hover"
            >
              Return to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;
