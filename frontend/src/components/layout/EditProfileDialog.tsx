import React, { useState } from 'react';
import { Dialog, DialogBody, DialogFooter, Button, FormGroup, InputGroup, Intent } from '@blueprintjs/core';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth.ts';
import { AppToaster } from '../../utils/toaster';
import styles from './EditProfileDialog.module.css';

export const EditProfileDialog: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { user, updateName } = useAuth();
  const [nameInput, setNameInput] = useState(user?.name ?? '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!nameInput.trim()) {
      return;
    }
    setIsSaving(true);
    try {
      await updateName(nameInput.trim());
      onClose();
      AppToaster.show({ message: t('editProfileSuccess'), intent: Intent.SUCCESS });
    } catch {
      AppToaster.show({ message: t('loginError'), intent: Intent.DANGER });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={t('editProfileTitle')} className={styles.dialog}>
      <DialogBody>
        <FormGroup label={t('editProfileName')}>
          <InputGroup 
            value={nameInput} 
            onChange={e => setNameInput(e.target.value)} 
            size="large" 
            autoFocus 
          />
        </FormGroup>
      </DialogBody>
      <DialogFooter actions={
        <>
          <Button onClick={onClose}>{t('cancel')}</Button>
          <Button intent={Intent.PRIMARY} loading={isSaving} onClick={handleSave}>
            {t('editProfileSave')}
          </Button>
        </>
      } />
    </Dialog>
  );
};
