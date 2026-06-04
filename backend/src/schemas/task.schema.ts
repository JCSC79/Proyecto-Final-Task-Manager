import * as yup from 'yup';
import { TaskStatus, TaskPriority } from '../models/task.model.ts';

/**
 * UUID-format regex that validates hex structure without checking RFC 4122 version/variant bits.
 * yup's built-in .uuid() is too strict — it rejects version-0 UUIDs used in seeds.
 * Referential integrity is enforced by the PostgreSQL FK constraint instead.
 */
const uuidFormat = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validation schema for task creation.
 * Added projectId validation to support new database structure.
 */
export const createTaskSchema = yup.object({
    title: yup.string()
        .required('err_title_required')
        .min(3, 'err_title_short')
        .max(50, 'err_title_long'),
    description: yup.string()
        .required('err_desc_required')
        .min(10, 'err_desc_short'),
    projectId: yup.string().matches(uuidFormat).optional(),
    categoryId: yup.string().matches(uuidFormat, 'err_categoryId_invalid').optional(),
    priority: yup.mixed<typeof TaskPriority[keyof typeof TaskPriority]>()
        .oneOf([...Object.values(TaskPriority), undefined] as const, 'err_priority_invalid')
        .optional()
});

/**
 * Validation schema for task updates.
 * We apply the same translation keys to maintain consistency.
 */
export const updateTaskSchema = yup.object({
    title: yup.string()
        .min(3, 'err_title_short')
        .max(50, 'err_title_long'),
    description: yup.string()
        .min(10, 'err_desc_short'),
    status: yup.mixed<TaskStatus>()
        .oneOf(Object.values(TaskStatus), 'err_status_invalid'),
    projectId: yup.string().matches(uuidFormat).optional(),
    // null explicitly clears the category; a valid UUID assigns one; undefined leaves it unchanged
    categoryId: yup.string().nullable().optional().test(
        'uuid-or-null',
        'err_categoryId_invalid',
        (val) => val == null || uuidFormat.test(val)
    ),
    priority: yup.string()
        .oneOf([...Object.values(TaskPriority)], 'err_priority_invalid')
        .nullable()
        .optional()
});