'use client';

import { FamilyMember } from '@/types/family';
import { getAge, formatDate } from '@/utils/family';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface MemberCardProps {
  member: FamilyMember;
  onEdit: (member: FamilyMember) => void;
  onDelete: (id: string) => void;
  onAddChild: (parentId: string) => void;
  compact?: boolean;
}

export default function MemberCard({
  member,
  onEdit,
  onDelete,
  onAddChild,
  compact = false,
}: MemberCardProps) {
  const age = member.birthDate ? getAge(member.birthDate, member.deathDate) : null;

  if (compact) {
    return (
      <Card className="p-3 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => onEdit(member)}>
        <div className="flex items-start gap-3">
          {member.photoUrl && (
            <img
              src={member.photoUrl}
              alt={member.name}
              className="w-12 h-12 object-cover rounded-full"
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{member.name}</p>
            {member.occupation && <p className="text-xs text-gray-600 truncate">{member.occupation}</p>}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Photo */}
        {member.photoUrl && (
          <div className="flex-shrink-0">
            <img
              src={member.photoUrl}
              alt={member.name}
              className="w-32 h-32 object-cover rounded-lg"
            />
          </div>
        )}

        {/* Details */}
        <div className="flex-1">
          <h3 className="text-2xl font-bold mb-2">{member.name}</h3>

          {/* Life Info */}
          {member.birthDate && (
            <div className="text-sm text-gray-600 mb-4">
              <p>
                Born: {formatDate(member.birthDate)}
                {age !== null && ` (Age: ${age})`}
              </p>
              {member.deathDate && (
                <p>Died: {formatDate(member.deathDate)}</p>
              )}
            </div>
          )}

          {/* Professional Info */}
          {(member.occupation || member.location) && (
            <div className="mb-4">
              {member.occupation && <p className="text-sm"><strong>Occupation:</strong> {member.occupation}</p>}
              {member.location && <p className="text-sm"><strong>Location:</strong> {member.location}</p>}
            </div>
          )}

          {/* Bio */}
          {member.bio && (
            <div className="mb-4">
              <p className="text-sm text-gray-700">{member.bio}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(member)}
            >
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAddChild(member.id)}
            >
              Add Child
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 hover:bg-red-50"
              onClick={() => {
                if (confirm('Are you sure you want to delete this person and all their descendants?')) {
                  onDelete(member.id);
                }
              }}
            >
              Delete
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
