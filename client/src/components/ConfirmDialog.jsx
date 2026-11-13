import Modal from './Modal.jsx';
import Button from './Button.jsx';

export default function ConfirmDialog({ open, onClose, onConfirm, title, description, confirmLabel = 'Confirm', loading }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-ink-600 dark:text-ink-300">
        This action cannot be undone. Any attempts recorded for this quiz are removed as well.
      </p>
    </Modal>
  );
}
