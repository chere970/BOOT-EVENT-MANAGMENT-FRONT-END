interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  variant?: "primary" | "secondary";
}

export default function Button({
  children,
  isLoading,
  variant = "primary",
  ...props
}: ButtonProps) {
  const baseClasses =
    "w-full flex justify-center py-2 px-4 border rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50";

  const variants = {
    primary:
      "border-transparent text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
    secondary:
      "border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-blue-500",
  };

  return (
    <button
      {...props}
      disabled={isLoading}
      className={`${baseClasses} ${variants[variant]}`}
    >
      {isLoading ? "Processing.." : children}
    </button>
  );
}
