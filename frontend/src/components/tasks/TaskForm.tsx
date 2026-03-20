import React, { useState } from "react";
import { Card, Elevation, Button, InputGroup, TextArea, FormGroup, H4, Intent } from "@blueprintjs/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../api/axiosInstance";
import { useTranslation } from "react-i18next";
import { AppToaster } from "../../utils/toaster";

/**
 * TaskForm Component
 * Updated: Receives isDark prop to dynamically change its background color.
 * Integrated: AppToaster for success feedback on creation.
 */
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
      // SUCCESS NOTIFICATION: Professional feedback after creation
      AppToaster.show({
        message: t('taskCreated'),
        intent: Intent.SUCCESS,
        icon: "tick-circle"
      });
      handleClear();
    },
  });

  const handleClear = () => {
    setTitle("");
    setDescription("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    mutation.mutate({ title, description });
  };

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
        <FormGroup label={t('title')} labelFor="title-input" labelInfo={`(${t('required')})`}>
          <InputGroup id="title-input" large placeholder={t('placeholderTitle')} value={title} onChange={(e) => setTitle(e.target.value)} />
        </FormGroup>

        <FormGroup label={t('description')} labelFor="description-input">
          <TextArea fill={true} large id="description-input" placeholder={t('placeholderDesc')} value={description} onChange={(e) => setDescription(e.target.value)} style={{ minHeight: '120px', resize: 'vertical' }} />
        </FormGroup>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button intent="primary" text={t('addTask')} icon="add" type="submit" loading={mutation.isPending} fill large style={{ fontWeight: 'bold', letterSpacing: '1px', flex: 3 }} />
          <Button intent="none" text={t('clear')} icon="eraser" onClick={handleClear} large style={{ flex: 1 }} />
        </div>
      </form>
    </Card>
  );
};