import { useState } from "react";
import { Card, Elevation, Button, InputGroup, TextArea, FormGroup, H4 } from "@blueprintjs/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/axiosInstance";

/**
 * TaskForm Component
 * Handles the creation of new tasks by communicating with the Backend API
 */
export const TaskForm = () => {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  /**
   * Mutation to post a new task
   */
  const mutation = useMutation({
    mutationFn: (newTask: { title: string; description: string }) => {
      return api.post("/tasks", newTask);
    },
    onSuccess: () => {
      // Invalidate and refetch the tasks list to show the new one immediately
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      // Reset local form state
      setTitle("");
      setDescription("");
    },
  });

  const handleSubmit = () => {
    if (!title.trim()) return;
    mutation.mutate({ title, description });
  };

  return (
    <Card 
      elevation={Elevation.TWO} 
      style={{ marginBottom: "30px", backgroundColor: "#ebf1f5" }}
    >
      <H4>Create New Task</H4>
      
      <FormGroup label="Title" labelFor="title-input" labelInfo="(required)">
        <InputGroup 
          id="title-input" 
          placeholder="Enter task title..." 
          value={title} 
          onChange={(e) => setTitle(e.target.value)} 
        />
      </FormGroup>

      <FormGroup label="Description" labelFor="description-input">
        <TextArea 
          fill={true} 
          id="description-input" 
          placeholder="Enter task details..." 
          value={description} 
          onChange={(e) => setDescription(e.target.value)} 
          style={{ minHeight: '80px' }}
        />
      </FormGroup>

      <Button 
        intent="primary" 
        icon="add" 
        large={true}
        onClick={handleSubmit}
        loading={mutation.isPending} // Show spinner inside button while saving
      >
        Add Task
      </Button>
    </Card>
  );
};
