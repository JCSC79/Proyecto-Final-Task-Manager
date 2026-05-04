import * as yup from 'yup';

/**
 * Schema for new user registration.
 * Using translation keys instead of hardcoded strings for i18n compatibility.
 */
export const registerSchema = yup.object({
    email: yup.string()
        .trim()
        .required('err_email_required')
        .email('err_email_invalid'),
    
    password: yup.string()
        .required('err_password_required')
        .min(8, 'err_password_too_short')
        .matches(/[a-zA-Z]/, 'err_password_no_letter')
        .matches(/[0-9]/, 'err_password_no_number')
        .matches(/[^a-zA-Z0-9]/, 'err_password_no_special'),

    name: yup.string()
        .trim()
        .min(2, 'err_name_too_short')
        .optional()
});

/**
 * Schema for user login.
 */
export const loginSchema = yup.object({
    email: yup.string()
        .required('err_email_required')
        .email('err_email_invalid'),
    password: yup.string()
        .required('err_password_required')
});