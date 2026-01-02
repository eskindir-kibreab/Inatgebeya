import React, { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Lock, CheckCircle, ArrowLeft } from "lucide-react";
import { authAPI } from "../../api";
import { useAuth } from "../../context/AuthContext";
import Input from "../../components/forms/Input";
import Button from "../../components/forms/Button";
import toast from "react-hot-toast";

const ResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { fetchUser } = useAuth();
  const [verificationToken, setVerificationToken] = useState(
    location.state?.verification_token || ""
  );
  const [email, setEmail] = useState(location.state?.email || "");
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    letter: false,
    number: false,
  });

  // If no verification token, redirect to forgot password
  React.useEffect(() => {
    if (!verificationToken || !email) {
      navigate("/forgot-password");
    }
  }, [verificationToken, email, navigate]);

  const handlePasswordChange = (value) => {
    setFormData((prev) => ({ ...prev, newPassword: value }));

    // Check password requirements
    setPasswordRequirements({
      length: value.length >= 6,
      letter: /[a-zA-Z]/.test(value),
      number: /\d/.test(value),
    });
  };

  const validateForm = () => {
    const errors = [];

    if (!formData.newPassword) {
      errors.push("New password is required");
    } else {
      if (formData.newPassword.length < 6) {
        errors.push("Password must be at least 6 characters");
      }
      if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(formData.newPassword)) {
        errors.push("Password must contain letters and numbers");
      }
    }

    if (formData.newPassword !== formData.confirmPassword) {
      errors.push("Passwords do not match");
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = validateForm();
    if (errors.length > 0) {
      errors.forEach((error) => toast.error(error));
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.resetPassword({
        verification_token: verificationToken,
        newPassword: formData.newPassword,
      });

      if (response.success) {
        toast.success("Password reset successfully!");

        // Auto-login logic
        const { token, user } = response.data;
        sessionStorage.setItem("token", token);
        await fetchUser();

        // Redirect based on role
        const role = user.role_name;
        if (role === "admin" || role === "super_admin") {
          navigate("/admin/dashboard");
        } else if (role === "shop_owner") {
          navigate("/shop-owner/dashboard");
        } else if (role === "delivery_person") {
          navigate("/delivery-person/dashboard");
        } else {
          navigate("/");
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  const allRequirementsMet = Object.values(passwordRequirements).every(Boolean);

  return (
    <div className="fixed inset-0 z-[100] bg-white dark:bg-gray-900 overflow-y-auto py-12 px-4 transition-all duration-300">
      <div className="flex items-center justify-center min-h-full">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div
              className="inline-flex items-center justify-center w-16 h-16 
                         bg-primary/10 rounded-full mb-4"
            >
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-text-main dark:text-gray-200">
              Reset Password
            </h1>
            <p className="text-text-secondary dark:text-gray-400 mt-2">
              Create a new password for your account
            </p>
          </div>

          <div
            className="bg-white dark:bg-gray-800 rounded-2xl border border-border-default 
                       dark:border-gray-700 p-8 shadow-2xl dark:shadow-black/50"
          >
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <p className="text-sm text-text-secondary dark:text-gray-400 mb-4">
                  Setting up new password for <strong>{email}</strong>
                </p>
              </div>

              <Input
                label="New Password"
                type="password"
                value={formData.newPassword}
                onChange={(e) => handlePasswordChange(e.target.value)}
                placeholder="Enter new password"
                required
                icon={Lock}
                className="mb-4"
              />

              {/* Password Requirements */}
              <div className="mb-6 space-y-2">
                <p className="text-sm font-medium text-text-main dark:text-gray-200">
                  Password must contain:
                </p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle
                      className={`w-4 h-4 ${passwordRequirements.length
                        ? "text-green-600"
                        : "text-gray-300"
                        }`}
                    />
                    <span
                      className={`text-sm ${passwordRequirements.length
                        ? "text-green-600 dark:text-green-400"
                        : "text-text-secondary dark:text-gray-400"
                        }`}
                    >
                      At least 6 characters
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle
                      className={`w-4 h-4 ${passwordRequirements.letter
                        ? "text-green-600"
                        : "text-gray-300"
                        }`}
                    />
                    <span
                      className={`text-sm ${passwordRequirements.letter
                        ? "text-green-600 dark:text-green-400"
                        : "text-text-secondary dark:text-gray-400"
                        }`}
                    >
                      At least one letter
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle
                      className={`w-4 h-4 ${passwordRequirements.number
                        ? "text-green-600"
                        : "text-gray-300"
                        }`}
                    />
                    <span
                      className={`text-sm ${passwordRequirements.number
                        ? "text-green-600 dark:text-green-400"
                        : "text-text-secondary dark:text-gray-400"
                        }`}
                    >
                      At least one number
                    </span>
                  </div>
                </div>
              </div>

              <Input
                label="Confirm New Password"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    confirmPassword: e.target.value,
                  }))
                }
                placeholder="Confirm new password"
                required
                icon={Lock}
                className="mb-6"
              />

              {/* Password Match Check */}
              {formData.confirmPassword && (
                <div
                  className={`mb-6 p-3 rounded-lg ${formData.newPassword === formData.confirmPassword
                    ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                    : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                    }`}
                >
                  <div className="flex items-center gap-2">
                    {formData.newPassword === formData.confirmPassword ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <span className="text-sm text-green-700 dark:text-green-400">
                          Passwords match
                        </span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                        <span className="text-sm text-red-700 dark:text-red-400">
                          Passwords do not match
                        </span>
                      </>
                    )}
                  </div>
                </div>
              )}

              <Button
                type="submit"
                loading={loading}
                fullWidth
                disabled={
                  !allRequirementsMet ||
                  formData.newPassword !== formData.confirmPassword
                }
              >
                Reset Password
              </Button>
            </form>

            <div
              className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 
                         dark:border-blue-800 rounded-lg"
            >
              <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-2">
                Security Tips:
              </h3>
              <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                <li>• Don't reuse old passwords</li>
                <li>• Avoid personal information in passwords</li>
                <li>• Consider using a password manager</li>
              </ul>
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
    </div>
  );
};

export default ResetPassword;
