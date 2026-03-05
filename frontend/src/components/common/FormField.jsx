// Reusable FormField component
// Usage: <FormField label="Name" type="text" value={v} onChange={fn} />
import React from 'react';

const FormField = ({
    label,
    type = 'text',
    value,
    onChange,
    placeholder,
    required = false,
    error,
    hint,
    options = [],       // for select type
    className = '',
    inputClassName = '',
    disabled = false,
    step,
    min,
    max,
}) => {
    const baseInputClass = inputClassName || "w-full bg-[#1a1a1a] text-white border border-[#333] rounded-md px-3 py-2 outline-none focus:border-red-500";

    return (
        <div className={className}>
            {label && (
                <label className="block text-sm font-medium text-gray-400 mb-1">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}

            {type === 'select' ? (
                <select
                    value={value}
                    onChange={onChange}
                    className={baseInputClass}
                    disabled={disabled}
                    required={required}
                >
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            ) : type === 'textarea' ? (
                <textarea
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    className={baseInputClass}
                    disabled={disabled}
                    required={required}
                    rows={4}
                />
            ) : (
                <input
                    type={type}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    className={baseInputClass}
                    disabled={disabled}
                    required={required}
                    step={step}
                    min={min}
                    max={max}
                />
            )}

            {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
    );
};

export default FormField;
