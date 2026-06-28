'use client';

import { FamilyMember } from '@/types/family';
import MemberCard from './MemberCard';
import { useState } from 'react';

interface TreeListViewProps {
  members: Record<string, FamilyMember>;
  rootId: string;
  onSelectMember: (memberId: string) => void;
  onEdit: (member: FamilyMember) => void;
  onDelete: (id: string) => void;
  onAddChild: (parentId: string) => void;
  selectedMemberId?: string;
}

interface ExpandedNodes {
  [memberId: string]: boolean;
}

export default function TreeListView({
  members,
  rootId,
  onSelectMember,
  onEdit,
  onDelete,
  onAddChild,
  selectedMemberId,
}: TreeListViewProps) {
  const [expandedNodes, setExpandedNodes] = useState<ExpandedNodes>({
    [rootId]: true,
  });

  const toggleNode = (memberId: string) => {
    setExpandedNodes(prev => ({
      ...prev,
      [memberId]: !prev[memberId],
    }));
  };

  const renderTreeNode = (memberId: string, depth: number = 0) => {
    const member = members[memberId];
    if (!member) return null;

    const hasChildren = member.childrenIds.length > 0;
    const isExpanded = expandedNodes[memberId];

    return (
      <div key={memberId} className="w-full">
        <div
          className={`flex items-center gap-2 p-2 ml-${depth * 4} cursor-pointer hover:bg-gray-100 rounded ${
            selectedMemberId === memberId ? 'bg-blue-100 border-l-4 border-blue-600' : ''
          }`}
          onClick={() => {
            onSelectMember(memberId);
            if (hasChildren && !isExpanded) {
              toggleNode(memberId);
            }
          }}
        >
          {/* Expand/Collapse Button */}
          {hasChildren && (
            <button
              onClick={e => {
                e.stopPropagation();
                toggleNode(memberId);
              }}
              className="w-6 h-6 flex items-center justify-center text-gray-600 hover:bg-gray-200 rounded"
            >
              <span className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                ▶
              </span>
            </button>
          )}

          {!hasChildren && <div className="w-6" />}

          {/* Member Info */}
          <div
            className="flex-1 min-w-0"
            onClick={() => onSelectMember(memberId)}
          >
            <div className="flex items-center gap-2 min-w-0">
              {member.photoUrl && (
                <img
                  src={member.photoUrl}
                  alt={member.name}
                  className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                />
              )}
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">{member.name}</p>
                {member.occupation && (
                  <p className="text-xs text-gray-600 truncate">{member.occupation}</p>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-1 flex-shrink-0">
            <button
              onClick={e => {
                e.stopPropagation();
                onEdit(member);
              }}
              className="px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 rounded text-blue-700"
            >
              Edit
            </button>
            <button
              onClick={e => {
                e.stopPropagation();
                onAddChild(memberId);
              }}
              className="px-2 py-1 text-xs bg-green-100 hover:bg-green-200 rounded text-green-700"
            >
              +Child
            </button>
          </div>
        </div>

        {/* Children */}
        {isExpanded && hasChildren && (
          <div className="ml-2 border-l border-gray-300">
            {member.childrenIds.map(childId =>
              renderTreeNode(childId, depth + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full bg-white rounded-lg border overflow-y-auto">
      <div className="p-4 space-y-1">
        {renderTreeNode(rootId, 0)}
      </div>
    </div>
  );
}
