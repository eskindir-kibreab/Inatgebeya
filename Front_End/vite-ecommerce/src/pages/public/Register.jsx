import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Lock, Phone } from "lucide-react";
import { authAPI } from "../../api/auth.api";
import Input from "../../components/forms/Input";
import Button from "../../components/forms/Button";
import toast from "react-hot-toast";

const Register = () => {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    fan_number: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    const fullName = formData.full_name.trim();
    const nonSpaces = fullName.replace(/\s/g, "");

    if (!fullName) {
      newErrors.full_name = "Full name is required";
    } else if (!fullName.includes(" ") || nonSpaces.length < 6) {
      newErrors.full_name = "Enter valid name";
    } else if (!/^[a-zA-Z\s]+$/.test(fullName)) {
      newErrors.full_name = "Name must contain only letters (a-z, A-Z)";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (formData.phone) {
      if (!/^\d+$/.test(formData.phone)) {
        newErrors.phone = "Phone number must contain only digits (0-9)";
      } else if (formData.phone.length < 3 || formData.phone.length > 10) {
        newErrors.phone = "Phone number must be between 3 and 10 digits";
      }
    }

    if (!formData.fan_number) {
      newErrors.fan_number = "National ID (Fan Number) is required";
    } else if (!/^\d+$/.test(formData.fan_number)) {
      newErrors.fan_number = "it must be number";
    } else if (formData.fan_number.length !== 14) {
      newErrors.fan_number = "Fan number must be exactly 14 digits";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    } else if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = "Password must contain letters and numbers";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
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
      const userData = {
        full_name: formData.full_name,
        email: formData.email,
        password: formData.password,
        fan_number: formData.fan_number,
        ...(formData.phone && { phone: formData.phone }),
      };

      const response = await authAPI.register(userData);

      if (response.success) {
        toast.success("Registration successful! Please verify your email.");
        // Immediately redirect to OTP verification page with the email
        navigate("/verify-otp", {
          state: {
            email: formData.email,
            message:
              "Please enter the OTP sent to your email to verify your account.",
          },
        });
      }
    } catch (error) {
      setErrors({
        general: error.response?.data?.message || "Registration failed",
      });
    } finally {
      setLoading(false);
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
              <User className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-text-main dark:text-gray-200">
              Create Account
            </h1>
            <p className="text-text-secondary dark:text-gray-400 mt-2">
              Join InatGebeya today
            </p>
          </div>

          <div
            className="bg-white dark:bg-gray-800 rounded-2xl border border-border-default 
                       dark:border-gray-700 p-8 shadow-2xl dark:shadow-black/50"
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
                label="Full Name"
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="John Doe"
                error={errors.full_name}
                required
                icon={User}
              />

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
                label="Phone Number (Optional)"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="0912345678"
                error={errors.phone}
                icon={Phone}
              />

              <Input
                label="National ID (Fan Number)"
                type="text"
                name="fan_number"
                value={formData.fan_number}
                onChange={handleChange}
                placeholder="Ex: 12345678901234"
                error={errors.fan_number}
                required
                icon={Lock}
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

              <Input
                label="Confirm Password"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                error={errors.confirmPassword}
                required
                icon={Lock}
              />

              <div className="mb-6">
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id="terms"
                    className="w-4 h-4 text-primary rounded focus:ring-primary 
                           border-border-default mt-1"
                    required
                  />
                  <label
                    htmlFor="terms"
                    className="ml-2 text-sm text-text-secondary dark:text-gray-400"
                  >
                    I agree to the{" "}
                    <a href="/terms" className="text-primary hover:underline">
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a href="/privacy" className="text-primary hover:underline">
                      Privacy Policy
                    </a>
                  </label>
                </div>
              </div>

              <Button type="submit" loading={loading} fullWidth>
                Create Account
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-text-secondary dark:text-gray-400">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-primary hover:text-primary-hover font-medium"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-text-muted dark:text-gray-500">
              By registering, you agree to receive account verification emails
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
