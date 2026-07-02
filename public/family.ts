export interface FamilyMember {
  id: string;
  name: string;
  parentId: string | null;
  spouseIds: string[];
  childrenIds: string[];
  birthDate: string; // YYYY-MM-DD format
  deathDate: string | null; // YYYY-MM-DD format
  photoUrl: string | null;
  occupation: string;
  location: string;
  bio: string;
  generation: number;
}

export interface FamilyTree {
  rootId: string;
  members: Record<string, FamilyMember>;
  createdAt: string;
  updatedAt: string;
}
