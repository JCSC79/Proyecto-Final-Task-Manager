export interface IProjectSettings {
  projectId: string;
  description: string | null;
  color: string;
  isPublic: boolean;
  createdAt?: string;
}

export interface IProject {
  id: string;
  name: string;
  userId: string;
  createdAt?: string;
  settings: IProjectSettings;
  memberRole: 'OWNER' | 'MEMBER' | null;
  memberCount: number;
}
