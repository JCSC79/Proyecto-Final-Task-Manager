import React from 'react';
import { Tag } from '@blueprintjs/core';
import type { ITag } from '../../types/task';
import { hexToIntent } from '../../utils/hexToIntent';

interface TagBadgeProps {
  tag: ITag;
}

export const TagBadge: React.FC<TagBadgeProps> = ({ tag }) => (
  <Tag intent={hexToIntent(tag.color)} round minimal title={tag.name}>
    {tag.name}
  </Tag>
);

