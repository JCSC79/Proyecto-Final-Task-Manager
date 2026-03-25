import React, { useState } from 'react';
import { Dialog, Button, FormGroup, InputGroup, Intent, Classes, Divider, Icon } from "@blueprintjs/core";
import { useTranslation } from 'react-i18next';
import api from '../../api/axiosInstance'; 
import { AppToaster } from '../../utils/toaster'; 

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentName: string;
  currentRole: string; 
  onUpdateSuccess: (newName: string, newRole?: string) => void;
  isDark: boolean;
}

/**
 * ProfileModal Component
 * Phase 6 Update: Role-Based Display.
 * Users can update their profile information, but administrative status
 * is managed exclusively by the backend for security integrity.
 */
export const ProfileModal: React.FC<ProfileModalProps> = ({ 
  isOpen, onClose, currentName, currentRole, onUpdateSuccess, isDark 
}) => {
  const { t } = useTranslation();
  const [name, setName] = useState(currentName);
  const [loading, setLoading] = useState(false);

  /**
   * Sends profile updates to the backend.
   * Only 'name' is updatable by the user. Role changes are restricted at API level.
   */
  const handleSave = async () => {
    if (name.trim().length < 2) {
      AppToaster.show({ message: "Name is too short", intent: Intent.DANGER });
      return;
    }

    setLoading(true);
    try {
      // Phase 6: Call hardened endpoint. Role change via body is ignored by server
      // unless requester is already an authorized admin.
      const response = await api.put('/auth/profile', { name: name.trim() });
      
      // Update local state with confirmed data from server
      onUpdateSuccess(response.data.name);
      onClose();
    } catch (error: unknown) {
      AppToaster.show({ message: "Update failed", intent: Intent.DANGER });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog 
        isOpen={isOpen} 
        onClose={onClose} 
        title={t('editProfile')} 
        className={isDark ? "bp4-dark" : ""}
        icon="user"
    >
      <div className={Classes.DIALOG_BODY}>
        <FormGroup label={t('fullName')}>
          <InputGroup 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            leftIcon="person" 
            large 
            autoFocus 
          />
        </FormGroup>

        {/* ADMINISTRATIVE STATUS BADGE
            This section only displays if the verified JWT token contains the ADMIN role.
            Self-promotion buttons are removed to prevent unauthorized access attempts.
        */}
        {currentRole === 'ADMIN' && (
          <div style={{ 
            textAlign: 'center', 
            marginTop: '20px', 
            padding: '15px', 
            borderRadius: '8px', 
            backgroundColor: isDark ? 'rgba(217, 130, 43, 0.1)' : '#fff3e0' 
          }}>
            <Divider style={{ marginBottom: '15px' }} />
            <Icon icon="shield" intent={Intent.WARNING} style={{ marginBottom: '10px' }} />
            <p style={{ fontSize: '0.85em', fontWeight: 'bold', margin: 0 }}>Administrator Mode</p>
            <p style={{ fontSize: '0.8em', color: isDark ? '#a7b6c2' : '#5c7080' }}>
              Your account has elevated privileges. Global system actions are enabled.
            </p>
          </div>
        )}
      </div>
      <div className={Classes.DIALOG_FOOTER}>
        <div className={Classes.DIALOG_FOOTER_ACTIONS}>
          <Button onClick={onClose} text={t('cancel')} />
          <Button 
            intent={Intent.PRIMARY} 
            onClick={handleSave} 
            loading={loading} 
            text={t('save')} 
          />
        </div>
      </div>
    </Dialog>
  );
};