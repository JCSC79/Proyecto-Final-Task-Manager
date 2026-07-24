import React from 'react';
import { Tag } from '@blueprintjs/core';

interface AssigneeBadgeProps {
  assignee: { id: string; name: string; email: string };
}

export const AssigneeBadge: React.FC<AssigneeBadgeProps> = ({ assignee }) => (
  <Tag icon="person" round minimal title={assignee.email}>
    {assignee.name}
  </Tag>
);
