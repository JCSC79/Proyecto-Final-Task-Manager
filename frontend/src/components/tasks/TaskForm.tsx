import React, { useState } from "react";
import { Card, Elevation, Button, InputGroup, TextArea, FormGroup, H4 } from "@blueprintjs/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../api/axiosInstance";
import { useTranslation } from "react-i18next"; // Import i18n hook

/**
 * TaskForm Component
 * UI upgraded to 'large' variants for better accessibility and modern look
 * Updated with i18n support and a Clear button.
 */
export const TaskForm: React.FC = () => {
  const { t } = useTranslation(); // Initialize translation
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const mutation = useMutation({
    mutationFn: (newTask: { title: string; description: string }) => api.post("/tasks", newTask),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      handleClear(); // Use clear handler on success to empty the form
    },
  });

  // Helper function to clear the form
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
      elevation={Elevation.TWO} 
      style={{ marginBottom: "30px", backgroundColor: "#ebf1f5", padding: '25px' }}
    >
      <H4 style={{ marginBottom: '20px' }}>{t('createTask')}</H4>
      
      <form onSubmit={handleSubmit}>
        <FormGroup label={t('title')} labelFor="title-input" labelInfo={`(${t('required')})`}>
          <InputGroup 
            id="title-input" 
            large // Larger input field
            placeholder={t('placeholderTitle')} 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
          />
        </FormGroup>

        <FormGroup label={t('description')} labelFor="description-input">
          <TextArea 
            fill={true} 
            large // Larger text area
            id="description-input" 
            placeholder={t('placeholderDesc')} 
            value={description} 
            onChange={(e) => setDescription(e.target.value)} 
            style={{ minHeight: '120px', resize: 'vertical' }}
          />
        </FormGroup>

        {/* Flex container for Add and Clear buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button 
            intent="primary" 
            text={t('addTask')} 
            icon="add"
            type="submit"
            loading={mutation.isPending}
            fill
            large // Much bigger and noticeable button
            style={{ fontWeight: 'bold', letterSpacing: '1px', flex: 3 }}
          />
          <Button 
            intent="none" 
            text={t('clear')} 
            icon="eraser"
            onClick={handleClear}
            large
            style={{ flex: 1 }}
          />
        </div>
      </form>
    </Card>
  );
};