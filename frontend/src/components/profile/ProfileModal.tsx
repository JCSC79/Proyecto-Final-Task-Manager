import React, { useState } from 'react';
import { Dialog, Button, FormGroup, InputGroup, Intent, Classes } from "@blueprintjs/core";
import { useTranslation } from 'react-i18next';
import api from '../../api/axiosInstance'; 
import { AppToaster } from '../../utils/toaster'; 

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentName: string;
  onUpdateSuccess: (newName: string) => void;
  isDark: boolean;
}

/**
 * ProfileModal Component
 * Phase 5: Allows users to update their display name.
 */
export const ProfileModal: React.FC<ProfileModalProps> = ({ 
  isOpen, 
  onClose, 
  currentName, 
  onUpdateSuccess,
  isDark 
}) => {
  const { t } = useTranslation();
  const [name, setName] = useState(currentName);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (name.trim().length < 2) {
      AppToaster.show({ message: "Name is too short", intent: Intent.DANGER });
      return;
    }

    setLoading(true);
    try {
      const response = await api.put('/auth/profile', { name: name.trim() });
      onUpdateSuccess(response.data.name);
      
      AppToaster.show({ 
        message: t('profileUpdated') || "Profile updated!", 
        intent: Intent.SUCCESS, 
        icon: "tick-circle" 
      });
      onClose();
    } catch (error: any) {
      AppToaster.show({ 
        message: error.response?.data?.error || "Error updating profile", 
        intent: Intent.DANGER 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      title={t('editProfile') || "Edit Profile"}
      isOpen={isOpen}
      onClose={onClose}
      className={isDark ? "bp4-dark" : ""}
      icon="user"
      canOutsideClickClose={true}
    >
      <div className={Classes.DIALOG_BODY}>
        <FormGroup label={t('fullName') || "Full Name"} labelFor="name-input">
          <InputGroup 
            id="name-input" 
            placeholder="Enter your name..." 
            value={name} 
            onChange={(e) => setName(e.target.value)}
            leftIcon="person"
            large
            autoFocus
          />
        </FormGroup>
      </div>
      <div className={Classes.DIALOG_FOOTER}>
        <div className={Classes.DIALOG_FOOTER_ACTIONS}>
          <Button onClick={onClose} text={t('cancel') || "Cancel"} minimal />
          <Button 
            intent={Intent.PRIMARY} 
            onClick={handleSave} 
            text={t('save') || "Save Changes"} 
            loading={loading}
          />
        </div>
      </div>
    </Dialog>
  );
};