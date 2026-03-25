import React, { useState } from "react";
import { Card, Elevation, Button, InputGroup, TextArea, FormGroup, H4, Intent } from "@blueprintjs/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../api/axiosInstance";
import { useTranslation } from "react-i18next";
import { AppToaster } from "../../utils/toaster";

/**
 * Interface to define the expected server error structure
 * Aligned with Phase 1 strict typing guidelines.
 */
interface ServerError {
  response?: {
    data?: {
      error?: string;
    };
  };
}

interface TaskFormProps {
  isDark: boolean;
}

export const TaskForm: React.FC<TaskFormProps> = ({ isDark }) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const mutation = useMutation({
    mutationFn: (newTask: { title: string; description: string }) => api.post("/tasks", newTask),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      AppToaster.show({
        message: t('taskCreated'),
        intent: Intent.SUCCESS,
        icon: "tick-circle"
      });
      handleClear();
    },
    // REFINEMENT: Removed 'any' by using the ServerError interface
    onError: (error: unknown) => {
      const serverError = error as ServerError;
      const errorMessage = serverError.response?.data?.error || t('errorMessage');
      
      AppToaster.show({
        message: errorMessage,
        intent: Intent.DANGER,
        icon: "warning-sign"
      });
    }
  });

  const handleClear = () => {
    setTitle("");
    setDescription("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // UI Validation: Prevents empty submissions and notifies user visually
    if (!title.trim() || !description.trim()) {
      AppToaster.show({
        message: t('requiredFieldsError'),
        intent: Intent.WARNING,
        icon: "info-sign"
      });
      return;
    }

    mutation.mutate({ title, description });
  };

  const labelStyle = { color: isDark ? '#f5f8fa' : 'inherit' };

  return (
    <Card 
      className={isDark ? "bp4-dark" : ""}
      elevation={Elevation.TWO} 
      style={{ 
        marginBottom: "30px", 
        padding: '25px',
        backgroundColor: isDark ? '#293742' : '#ffffff',
        transition: 'background-color 0.3s ease'
      }} 
    >
      <H4 style={{ marginBottom: '20px', color: isDark ? '#f5f8fa' : 'inherit' }}>{t('createTask')}</H4>
      
      <form onSubmit={handleSubmit}>
        <FormGroup 
          label={<span style={labelStyle}>{t('title')}</span>} 
          labelFor="title-input" 
          labelInfo={`(${t('required')})`}
        >
          <InputGroup 
            id="title-input" 
            large 
            placeholder={t('placeholderTitle')} 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
          />
        </FormGroup>

       <FormGroup 
          label={<span style={labelStyle}>{t('description')}</span>} 
          labelFor="description-input" 
          labelInfo={`(${t('required')})`}
        >
          <TextArea 
            fill={true} 
            large 
            id="description-input" 
            placeholder={t('placeholderDesc')} 
            value={description} 
            onChange={(e) => setDescription(e.target.value)} 
            style={{ minHeight: '120px', resize: 'vertical' }} 
          />
        </FormGroup>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button 
            intent="primary" 
            text={t('addTask')} 
            icon="add" 
            type="submit" 
            loading={mutation.isPending} 
            fill 
            large 
            style={{ fontWeight: 'bold', letterSpacing: '1px', flex: 3 }} 
          />
          <Button intent="none" text={t('clear')} icon="eraser" onClick={handleClear} large style={{ flex: 1 }} />
        </div>
      </form>
    </Card>
  );
};