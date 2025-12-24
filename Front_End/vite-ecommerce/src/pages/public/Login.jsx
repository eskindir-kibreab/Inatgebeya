import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import Input from "../../components/forms/Input";
import Button from "../../components/forms/Button";
import { getDefaultRoute } from "../../utils/navigation";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);

    try {
      const result = await login(formData.email, formData.password);

      if (result.success) {
        // Check for redirectAfterLogin in localStorage
        const redirectTo = localStorage.getItem("redirectAfterLogin") || getDefaultRoute(result.role);
        
        // Clear the redirectAfterLogin from localStorage
        if (localStorage.getItem("redirectAfterLogin")) {
          localStorage.removeItem("redirectAfterLogin");
        }
        
        navigate(redirectTo);
      } else {
        setErrors({ general: result.message || "Login failed" });
      }
    } catch (error) {
      setErrors({ general: "An error occurred. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 
                         bg-primary/10 rounded-full mb-4"
          >
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">IG</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-text-main dark:text-gray-200">
            Welcome Back
          </h1>
          <p className="text-text-secondary dark:text-gray-400 mt-2">
            Sign in to your account to continue
          </p>
        </div>

        <div
          className="bg-white dark:bg-gray-800 rounded-xl border border-border-default 
                       dark:border-gray-700 p-8"
        >
          {errors.general && (
            <div
              className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 
                          dark:border-red-800 rounded-lg"
            >
              <p className="text-red-600 dark:text-red-400 text-sm">
                {errors.general}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <Input
              label="Email Address"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              error={errors.email}
              required
              icon={Mail}
            />
            <Input
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              error={errors.password}
              required
              icon={Lock}
            />
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="remember"
                  className="w-4 h-4 text-primary rounded focus:ring-primary 
               border-border-default"
                />
                <label
                  htmlFor="remember"
                  className="ml-2 text-sm text-text-secondary dark:text-gray-400"
                >
                  Remember me
                </label>
              </div>

              <Link
                to="/forgot-password"
                className="text-sm text-primary hover:text-primary-hover"
              >
                Forgot password?
              </Link>
            </div>
            <Button type="submit" loading={loading} fullWidth>
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-text-secondary dark:text-gray-400">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="text-primary hover:text-primary-hover font-medium"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-text-muted">
            By continuing, you agree to our{" "}
            <a href="/terms" className="text-primary hover:underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
