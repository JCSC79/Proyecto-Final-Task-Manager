import React, { useState } from 'react';
import { Button, Dialog, DialogBody, DialogFooter, FormGroup, InputGroup, Intent } from '@blueprintjs/core';
import { useTranslation } from 'react-i18next';
import styles from './ProjectSelector.module.css';

const PROJECT_COLORS = [
  '#4C90F0', // blue
  '#29A634', // green
  '#C9372C', // red
  '#BF7326', // orange
  '#7157D9', // violet
] as const;

type ProjectColor = typeof PROJECT_COLORS[number];

interface ProjectFormDialogProps {
  /** 'create' shows an empty input + colour swatches; 'rename' pre-fills with currentName. */
  mode: 'create' | 'rename';
  isOpen: boolean;
  /** Required in rename mode — pre-fills the input and disables Save when unchanged. */
  currentName?: string;
  isLoading: boolean;
  onConfirm: (name: string, color?: string) => void;
  onClose: () => void;
}

/**
 * ProjectFormDialog — reusable dialog shared by Create and Rename project flows.
 * Manages its own input state; syncs with currentName each time the dialog opens.
 */
export const ProjectFormDialog: React.FC<ProjectFormDialogProps> = ({
  mode,
  isOpen,
  currentName = '',
  isLoading,
  onConfirm,
  onClose,
}) => {
  const { t } = useTranslation();
  const [value, setValue] = useState('');
  const [color, setColor] = useState<ProjectColor>(PROJECT_COLORS[0]);

  // Adjust input value during render when the dialog transitions from closed to open.
  // This is the React-recommended alternative to useEffect for derived state.
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (prevIsOpen !== isOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setValue(mode === 'rename' ? currentName : '');
      setColor(PROJECT_COLORS[0]);
    }
  }

  const isCreate = mode === 'create';
  const trimmed = value.trim();
  const isDisabled = trimmed.length < 2 || (!isCreate && trimmed === currentName.trim());

  const handleConfirm = () => {
    if (isDisabled) {
        return;
    }
    onConfirm(trimmed, isCreate ? color : undefined);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
        handleConfirm();
    }

    if (e.key === 'Escape') {
        onClose();
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      icon={isCreate ? 'add-application' : 'edit'}
      onClose={onClose}
      title={isCreate ? t('newProject') : t('renameProject')}
      className={styles.createDialog}
    >
      <DialogBody>
        <InputGroup
          placeholder={isCreate ? t('projectNamePlaceholder') : t('renameProjectPlaceholder')}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          maxLength={50}
          rightElement={
            value.length > 0 ? (
              <Button
                variant="minimal"
                icon="cross"
                onClick={() => setValue('')}
                tabIndex={-1}
                aria-label="Clear"
              />
            ) : undefined
          }
        />

        {isCreate && (
          <FormGroup label={t('projectColor')} style={{ marginTop: '0.75rem', marginBottom: 0 }}>
            <div className={styles.swatchRow} aria-label={t('projectColor')}>
              {PROJECT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={c}
                  className={`${styles.swatch} ${color === c ? styles.swatchSelected : ''}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </FormGroup>
        )}
      </DialogBody>
      <DialogFooter
        actions={
          <>
            <Button onClick={onClose}>{t('cancel')}</Button>
            <Button
              intent={Intent.PRIMARY}
              onClick={handleConfirm}
              loading={isLoading}
              disabled={isDisabled}
            >
              {isCreate ? t('create') : t('save')}
            </Button>
          </>
        }
      />
    </Dialog>
  );
};
