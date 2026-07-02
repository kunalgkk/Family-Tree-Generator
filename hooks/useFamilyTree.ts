'use client';

import { useState, useEffect, useCallback } from 'react';
import { FamilyTree, FamilyMember } from '@/types/family';

const STORAGE_KEY = 'family-tree-data';

export function useFamilyTree() {
  const [tree, setTree] = useState<FamilyTree | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    // Use a small delay to ensure we're on the client
    const timer = setTimeout(() => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          setTree(JSON.parse(stored));
        }
      } catch (error) {
        console.error('Failed to load family tree:', error);
      }
      setIsLoaded(true);
    }, 0);
    
    return () => clearTimeout(timer);
  }, []);

  // Save to localStorage whenever tree changes
  const saveTree = useCallback((newTree: FamilyTree) => {
    setTree(newTree);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newTree));
  }, []);

  // Create new tree with root member
  const createTree = useCallback((rootMember: FamilyMember) => {
    const newTree: FamilyTree = {
      rootId: rootMember.id,
      members: {
        [rootMember.id]: rootMember,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveTree(newTree);
  }, [saveTree]);

  // Add member to tree
  const addMember = useCallback((member: FamilyMember) => {
    if (!tree) return;
    const updated = {
      ...tree,
      members: {
        ...tree.members,
        [member.id]: member,
      },
      updatedAt: new Date().toISOString(),
    };
    
    // Update parent's children list if parent exists
    if (member.parentId && tree.members[member.parentId]) {
      const parent = tree.members[member.parentId];
      if (!parent.childrenIds.includes(member.id)) {
        updated.members[member.parentId] = {
          ...parent,
          childrenIds: [...parent.childrenIds, member.id],
        };
      }
    }
    
    saveTree(updated);
  }, [tree, saveTree]);

  // Update member details
  const updateMember = useCallback((id: string, updates: Partial<FamilyMember>) => {
    if (!tree || !tree.members[id]) return;
    const updated = {
      ...tree,
      members: {
        ...tree.members,
        [id]: {
          ...tree.members[id],
          ...updates,
          id, // Ensure ID doesn't change
        },
      },
      updatedAt: new Date().toISOString(),
    };
    saveTree(updated);
  }, [tree, saveTree]);

  // Delete member
  const deleteMember = useCallback((id: string) => {
    if (!tree || !tree.members[id]) return;
    
    const member = tree.members[id];
    const updated: FamilyTree = {
      ...tree,
      members: { ...tree.members },
      updatedAt: new Date().toISOString(),
    };

    // Remove from parent's children list
    if (member.parentId && updated.members[member.parentId]) {
      const parent = updated.members[member.parentId];
      updated.members[member.parentId] = {
        ...parent,
        childrenIds: parent.childrenIds.filter(childId => childId !== id),
      };
    }

    // Remove all children recursively
    const removeChildrenRecursive = (parentId: string) => {
      const childIds = updated.members[parentId]?.childrenIds || [];
      childIds.forEach(childId => {
        removeChildrenRecursive(childId);
        delete updated.members[childId];
      });
    };

    removeChildrenRecursive(id);
    delete updated.members[id];
    
    saveTree(updated);
  }, [tree, saveTree]);

  // Clear entire tree
  const clearTree = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setTree(null);
  }, []);

  return {
    tree,
    isLoaded,
    createTree,
    addMember,
    updateMember,
    deleteMember,
    clearTree,
    saveTree,
  };
}
