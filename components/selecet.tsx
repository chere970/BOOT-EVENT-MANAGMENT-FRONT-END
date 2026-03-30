import React from "react";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[]; // Custom prop
  error?: string;
}

// Notice how we "pull out" label, options, and error
// so they aren't part of "...props" anymore
export default function Select({
  label,
  options,
  error,
  ...props
}: SelectProps) {
  return (
    <div className="w-full">
      <label
        htmlFor={props.id || props.name}
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {label}
      </label>

      <select
        {...props} // This now only contains standard HTML attributes (id, value, onChange, etc.)
        className={`
          block w-full px-3 py-2 rounded-md shadow-sm border
          bg-white text-gray-900 font-medium
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          ${error ? "border-red-500" : "border-gray-400"} 
          transition duration-150 ease-in-out cursor-pointer
        `}
      >
        {/* We use the "options" variable we destructured above here */}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
