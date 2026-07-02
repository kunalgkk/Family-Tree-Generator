'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { FamilyTree, FamilyMember } from '@/types/family';
import { useFamilyTree } from '@/hooks/useFamilyTree';

interface FamilyContextType {
  tree: FamilyTree | null;
  isLoaded: boolean;
  createTree: (rootMember: FamilyMember) => void;
  addMember: (member: FamilyMember) => void;
  updateMember: (id: string, updates: Partial<FamilyMember>) => void;
  deleteMember: (id: string) => void;
  clearTree: () => void;
  getMember: (id: string) => FamilyMember | undefined;
  getChildren: (parentId: string) => FamilyMember[];
  getParent: (memberId: string) => FamilyMember | undefined;
  getSpouses: (memberId: string) => FamilyMember[];
}

const FamilyContext = createContext<FamilyContextType | undefined>(undefined);

export function FamilyProvider({ children }: { children: ReactNode }) {
  const familyTree = useFamilyTree();

  const getMember = (id: string) => {
    return familyTree.tree?.members[id];
  };

  const getChildren = (parentId: string) => {
    if (!familyTree.tree) return [];
    const parent = familyTree.tree.members[parentId];
    if (!parent) return [];
    return parent.childrenIds
      .map(childId => familyTree.tree?.members[childId])
      .filter((child): child is FamilyMember => !!child);
  };

  const getParent = (memberId: string) => {
    if (!familyTree.tree) return undefined;
    const member = familyTree.tree.members[memberId];
    if (!member || !member.parentId) return undefined;
    return familyTree.tree.members[member.parentId];
  };

  const getSpouses = (memberId: string) => {
    if (!familyTree.tree) return [];
    const member = familyTree.tree.members[memberId];
    if (!member) return [];
    return member.spouseIds
      .map(spouseId => familyTree.tree?.members[spouseId])
      .filter((spouse): spouse is FamilyMember => !!spouse);
  };

  const value: FamilyContextType = {
    tree: familyTree.tree,
    isLoaded: familyTree.isLoaded,
    createTree: familyTree.createTree,
    addMember: familyTree.addMember,
    updateMember: familyTree.updateMember,
    deleteMember: familyTree.deleteMember,
    clearTree: familyTree.clearTree,
    getMember,
    getChildren,
    getParent,
    getSpouses,
  };

  return (
    <FamilyContext.Provider value={value}>
      {children}
    </FamilyContext.Provider>
  );
}

export function useFamily() {
  const context = useContext(FamilyContext);
  if (!context) {
    throw new Error('useFamily must be used within FamilyProvider');
  }
  return context;
}
