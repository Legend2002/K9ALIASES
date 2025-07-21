

export type Alias = {
  id: string;
  alias: string;
  description: string;
  createdAt: string;
  isActive: boolean;
};

export type DeletedAlias = {
  id: string;
  alias: string;
  description: string;
  createdAt: string;
  deletedAt: string;
};

export type Domain = {
  id: string;
  userId: string;
  domainName: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
};

export type Username = {
    id: string;
    username: string;
    isDefault: boolean;
    description: string | null;
    isActive: boolean;
    createdAt: string;
};

export type Session = {
    id: string;
    token: string;
    userAgent: string;
    ipAddress: string;
    createdAt: string;
};
