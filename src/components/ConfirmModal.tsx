import { useEffect, useRef } from 'react';

function ConfirmModal({ isOpen, message, onConfirm, onCancel }) {
  const confirmRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => confirmRef.current?.focus(), 50);
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) onCancel();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="alertdialog" aria-modal="true" aria-label="Confirm deletion">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} aria-hidden="true" />
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-sm w-full p-6">
        <p className="text-gray-900 dark:text-gray-100 text-sm mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="btn-secondary btn-sm">Cancel</button>
          <button ref={confirmRef} onClick={onConfirm} className="btn-danger btn-sm" autoFocus>Delete</button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;