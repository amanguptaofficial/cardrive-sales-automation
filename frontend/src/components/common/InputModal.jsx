import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';

const InputModal = ({
  isOpen,
  onClose,
  onSubmit,
  title = 'Enter Information',
  label,
  placeholder,
  type = 'text',
  defaultValue = '',
  submitText = 'Submit',
  cancelText = 'Cancel',
  isLoading = false,
  required = true,
  validationMessage
}) => {
  const [value, setValue] = useState(defaultValue);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue);
      setError('');
    }
  }, [isOpen, defaultValue]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (required && !value.trim()) {
      setError(validationMessage || 'This field is required');
      return;
    }
    setError('');
    onSubmit(value);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full shadow-xl animate-in fade-in zoom-in duration-200">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={isLoading}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {label} {required && <span className="text-red-500">*</span>}
              </label>
              <input
                type={type}
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  setError('');
                }}
                placeholder={placeholder}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent ${
                  error ? 'border-red-300' : 'border-gray-300'
                }`}
                autoFocus
                disabled={isLoading}
              />
              {error && (
                <p className="text-xs text-red-600 mt-1">{error}</p>
              )}
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {cancelText}
              </button>
              <button
                type="submit"
                disabled={isLoading || (required && !value.trim())}
                className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  submitText
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InputModal;
