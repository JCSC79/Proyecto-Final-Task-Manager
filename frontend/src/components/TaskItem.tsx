import { Card, Elevation, Tag, H5, Text } from "@blueprintjs/core";

/**
 * TaskItem component props
 */
interface TaskItemProps {
  task: {
    id: string;
    title: string;
    description: string;
    status: string;
  };
}

/**
 * Single Task Card component
 */
export const TaskItem = ({ task }: TaskItemProps) => {
  // Determine intent and icon based on task status
  const isCompleted = task.status === 'COMPLETED';
  const statusIntent = isCompleted ? 'success' : 'warning';
  const statusIcon = isCompleted ? 'tick-circle' : 'time';

  // Helper to format text (e.g., COMPLETED -> Completed)
  const formatStatus = (status: string) => 
    status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

  return (
    <Card 
      elevation={Elevation.TWO} 
      interactive={true}
      style={{ 
        marginBottom: "15px", 
        borderRadius: "8px",
        // Adds a colored left border for quick visual status identification
        borderLeft: `5px solid ${isCompleted ? '#0F9960' : '#D9822B'}` 
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ paddingLeft: '10px' }}>
          <H5 style={{ 
            margin: 0, 
            textDecoration: isCompleted ? 'line-through' : 'none',
            color: isCompleted ? '#5c7080' : 'inherit'
          }}>
            {task.title}
          </H5>
          <Text ellipsize={true} style={{ color: '#5c7080', marginTop: '5px' }}>
            {task.description}
          </Text>
        </div>
        
        <Tag intent={statusIntent} icon={statusIcon} round={true} minimal={true}>
          {formatStatus(task.status)}
        </Tag>
      </div>
    </Card>
  );
};

