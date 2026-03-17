import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: {
          "appName": "TASK MANAGER",
          "home": "Home",
          "dashboard": "Dashboard",
          "progress": "BOARD PROGRESS",
          "search": "Search tasks...",
          "createTask": "Create New Task",
          "title": "Title",
          "description": "Description",
          "addTask": "ADD TASK",
          "clear": "Clear", 
          "noTasks": "No tasks here",
          "required": "required",
          "pending": "PENDING",
          "inProgress": "IN PROGRESS",
          "completed": "COMPLETED",
          "all": "ALL",
          "placeholderTitle": "What needs to be done?",
          "placeholderDesc": "Add some details...",
          "viewSource": "View Source on GitHub",
          "syncing": "Synchronizing with DB...",
          "editTask": "Edit Task",
          "taskDetails": "Task Details",
          "saveChanges": "Save Changes",
          "cancel": "Cancel",
          "close": "Close",
          "deleteWarning": "Are you sure you want to delete",
          "deleteAction": "This action is permanent.",
          "deleteTask": "Delete Task",
          "noDescription": "No description",
          "noDetails": "No additional details provided for this task."
        }
      },
      es: {
        translation: {
          "appName": "GESTOR DE TAREAS",
          "home": "Inicio",
          "dashboard": "Tablero",
          "progress": "PROGRESO DEL TABLERO",
          "search": "Buscar tareas...",
          "createTask": "Crear Nueva Tarea",
          "title": "Título",
          "description": "Descripción",
          "addTask": "AÑADIR TAREA",
          "clear": "Limpiar",
          "noTasks": "No hay tareas aquí",
          "required": "requerido",
          "pending": "PENDIENTE",
          "inProgress": "EN CURSO",
          "completed": "COMPLETADA",
          "all": "TODAS",
          "placeholderTitle": "¿Qué hay que hacer?",
          "placeholderDesc": "Añade algunos detalles...",
          "viewSource": "Ver código en GitHub",
          "syncing": "Sincronizando con la BD...",
          "editTask": "Editar Tarea",
          "taskDetails": "Detalles de la Tarea",
          "saveChanges": "Guardar Cambios",
          "cancel": "Cancelar",
          "close": "Cerrar",
          "deleteWarning": "¿Estás seguro de que deseas eliminar",
          "deleteAction": "Esta acción es permanente.",
          "deleteTask": "Eliminar Tarea",
          "noDescription": "Sin descripción",
          "noDetails": "No se proporcionaron detalles adicionales para esta tarea."
        }
      }
    },
    fallbackLng: "en",
    interpolation: { escapeValue: false }
  });

export default i18n;