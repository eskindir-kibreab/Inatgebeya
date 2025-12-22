import React from "react";
import { AlertTriangle } from "lucide-react";

const ErrorState = ({
  title = "Something went wrong",
  message = "We encountered an error while loading this page.",
  actionText = "Try Again",
  onAction,
}) => {
  return (
    <div className="text-center py-12">
      <div
        className="inline-flex items-center justify-center w-20 h-20 
                     bg-red-100 dark:bg-red-900/20 rounded-full mb-6"
      >
        <AlertTriangle className="w-10 h-10 text-red-600 dark:text-red-400" />
      </div>

      <h3 className="text-xl font-semibold text-text-main dark:text-gray-200 mb-2">
        {title}
      </h3>

      <p className="text-text-secondary dark:text-gray-400 mb-6 max-w-md mx-auto">
        {message}
      </p>

      {onAction && (
        <button onClick={onAction} className="btn-primary">
          {actionText}
        </button>
      )}
    </div>
  );
};

export default ErrorState;
