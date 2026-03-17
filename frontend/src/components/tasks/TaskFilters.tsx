import React from 'react';
import { InputGroup, ButtonGroup, Button, Card, Elevation } from "@blueprintjs/core";
// Use 'import type' for strict verbatimModuleSyntax compliance
import type { TaskStatus } from '../../types/task';
import { useTranslation } from 'react-i18next'; // Import i18n hook

interface TaskFiltersProps {
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  statusFilter: string;
  // Correctly typed: it accepts TaskStatus or 'ALL'
  setStatusFilter: (val: TaskStatus | 'ALL') => void;
}

/**
 * TaskFilters Component
 * Provides UI controls for searching and status filtering with strict typing
 * Updated with i18n support.
 */
export const TaskFilters: React.FC<TaskFiltersProps> = ({ 
  searchTerm, 
  setSearchTerm, 
  statusFilter, 
  setStatusFilter 
}) => {
  const { t } = useTranslation(); // Initialize translation

  return (
    <Card elevation={Elevation.ZERO} style={{ background: 'transparent', padding: 15, marginBottom: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ width: '500px' }}>
          <InputGroup 
            leftIcon="search" 
            placeholder={t('search')} 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <ButtonGroup>
          <Button text={t('all')} active={statusFilter === 'ALL'} onClick={() => setStatusFilter('ALL')} />
          <Button text={t('pending')} intent="warning" active={statusFilter === 'PENDING'} onClick={() => setStatusFilter('PENDING')} />
          <Button text={t('inProgress')} intent="primary" active={statusFilter === 'IN_PROGRESS'} onClick={() => setStatusFilter('IN_PROGRESS')} />
          <Button text={t('completed')} intent="success" active={statusFilter === 'COMPLETED'} onClick={() => setStatusFilter('COMPLETED')} />
        </ButtonGroup>
      </div>
    </Card>
  );
};