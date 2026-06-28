'use client';

import { useState } from 'react';
import { FamilyMember } from '@/types/family';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useFamily } from '@/context/FamilyContext';
import { getAge } from '@/utils/family';

interface FamilyMemberFormProps {
  member?: FamilyMember;
  parentId?: string;
  onSave: (member: FamilyMember) => void;
  onCancel: () => void;
  isNew?: boolean;
}

export default function FamilyMemberForm({
  member,
  parentId,
  onSave,
  onCancel,
  isNew = false,
}: FamilyMemberFormProps) {
  const { getMember } = useFamily();
  const [formData, setFormData] = useState<FamilyMember>(
    member || {
      id: `temp-${Date.now()}`,
      name: '',
      parentId: parentId || null,
      spouseIds: [],
      childrenIds: [],
      birthDate: '',
      deathDate: null,
      photoUrl: null,
      occupation: '',
      location: '',
      bio: '',
      generation: (getMember(parentId || '')?.generation || 0) + 1,
    }
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Please enter a name');
      return;
    }
    onSave(formData);
  };

  const age = formData.birthDate ? getAge(formData.birthDate, formData.deathDate) : null;

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-6">
            {isNew ? 'Add New Family Member' : 'Edit Family Member'}
          </h2>
        </div>

        {/* Basic Information */}
        <div className="space-y-4 border-b pb-4">
          <h3 className="font-semibold text-lg">Basic Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Full Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter full name"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Birth Date</label>
              <input
                type="date"
                name="birthDate"
                value={formData.birthDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Death Date</label>
              <input
                type="date"
                name="deathDate"
                value={formData.deathDate || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {age !== null && (
              <div>
                <label className="block text-sm font-medium mb-2">Age</label>
                <div className="px-3 py-2 bg-gray-100 rounded-lg">
                  {age} years old
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Professional Information */}
        <div className="space-y-4 border-b pb-4">
          <h3 className="font-semibold text-lg">Professional Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Occupation</label>
              <input
                type="text"
                name="occupation"
                value={formData.occupation}
                onChange={handleChange}
                placeholder="e.g., Engineer, Doctor, Teacher"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g., New York, USA"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Photo and Bio */}
        <div className="space-y-4 border-b pb-4">
          <h3 className="font-semibold text-lg">Photo & Bio</h3>

          <div>
            <label className="block text-sm font-medium mb-2">Photo URL</label>
            <input
              type="url"
              name="photoUrl"
              value={formData.photoUrl || ''}
              onChange={handleChange}
              placeholder="https://example.com/photo.jpg"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {formData.photoUrl && (
              <div className="mt-2">
                <img
                  src={formData.photoUrl}
                  alt={formData.name}
                  className="w-24 h-24 object-cover rounded-lg"
                  onError={() => setFormData(prev => ({ ...prev, photoUrl: null }))}
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Biography</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Write a brief biography or notes..."
              rows={4}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
            {isNew ? 'Add Member' : 'Update Member'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
