import * as yup from 'yup';
import { TaskStatus } from '../models/task.model.ts';

/**
 * Validation schema for task creation.
 * We define strict rules for the request body.
 */
export const createTaskSchema = yup.object({
    title: yup.string()
        .required('The title is mandatory')
        .min(3, 'Title must be at least 3 characters')
        .max(50, 'Title is too long'),
    description: yup.string()
        .required('Description is required')
        .min(10, 'Please, provide a more detailed description')
});

export const updateTaskSchema = yup.object({
    title: yup.string()
        .min(3, 'Title must be at least 3 characters')
        .max(50, 'Title is too long'),
    description: yup.string()
        .min(10, 'Description is too short'),
    status: yup.mixed<TaskStatus>()
        .oneOf(Object.values(TaskStatus), 'Invalid status value')
});