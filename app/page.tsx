'use client';

import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Trash2,
  Plus,
  Edit2,
  Download,
  FileJson,
  Image as ImageIcon,
  FileText,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface Member {
  id: string;
  name: string;
  gender?: 'male' | 'female';
  birthYear?: number;
  deathYear?: number;
  occupation?: string;
  location?: string;
  bio?: string;
  photo?: string;
  parentId?: string;
}

interface TreeNode {
  member: Member;
  children: TreeNode[];
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function FamilyTreeApp() {
  const [members, setMembers] = useState<Record<string, Member>>({});
  const [rootId, setRootId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isTreeView, setIsTreeView] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isAddingChild, setIsAddingChild] = useState(false);
  const [zoom, setZoom] = useState(1);
  const treeViewRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('familyTree');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setMembers(data.members || {});
        setRootId(data.rootId);
      } catch (e) {
        console.error('[v0] Load error:', e);
      }
    } else {
      // Create default root
      const defaultRoot: Member = {
        id: 'root-' + Date.now(),
        name: 'Root',
        gender: 'male',
      };
      setMembers({ [defaultRoot.id]: defaultRoot });
      setRootId(defaultRoot.id);
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (rootId && Object.keys(members).length > 0) {
      localStorage.setItem('familyTree', JSON.stringify({ members, rootId }));
    }
  }, [members, rootId]);

  const getChildren = (memberId: string): Member[] => {
    return Object.values(members).filter((m) => m.parentId === memberId);
  };

  const addMember = (parentId: string | null, newMember: Omit<Member, 'id' | 'parentId'>) => {
    const id = 'member-' + Date.now() + Math.random();
    const member: Member = {
      ...newMember,
      id,
      parentId,
    };
    setMembers({ ...members, [id]: member });
    return id;
  };

  const updateMember = (id: string, updates: Partial<Member>) => {
    setMembers({
      ...members,
      [id]: { ...members[id], ...updates },
    });
  };

  const deleteMember = (id: string) => {
    if (id === rootId) return;
    const newMembers = { ...members };
    delete newMembers[id];
    setMembers(newMembers);
  };

  const getGenderColor = (gender?: string) => {
    return gender === 'male' ? 'bg-green-400' : gender === 'female' ? 'bg-pink-400' : 'bg-gray-400';
  };

  const getGenderTextColor = (gender?: string) => {
    return 'text-white font-bold';
  };

  const selectedMember = selectedId ? members[selectedId] : null;

  const calculateTreeLayout = (memberId: string, depth: number = 0): TreeNode => {
    const member = members[memberId];
    if (!member) return null;

    const children = getChildren(memberId);
    const nodeWidth = 180;
    const nodeHeight = 90;

    const childNodes = children.map((child) => calculateTreeLayout(child.id, depth + 1));

    return {
      member,
      children: childNodes,
      x: 0,
      y: depth * 180,
      width: nodeWidth,
      height: nodeHeight,
    };
  };

  const layoutTree = (node: TreeNode, x: number, minX: { value: number }): void => {
    if (!node) return;

    const nodeWidth = 180;
    const minHorizontalGap = 40;

    if (node.children.length === 0) {
      node.x = x;
      minX.value = Math.max(minX.value, x + nodeWidth + minHorizontalGap);
      return;
    }

    let currentX = x;

    for (const child of node.children) {
      layoutTree(child, currentX, minX);
      currentX = minX.value;
    }

    const leftmostChild = Math.min(...node.children.map((c) => c.x));
    const rightmostChild = Math.max(...node.children.map((c) => c.x + nodeWidth));
    const childrenCenter = (leftmostChild + rightmostChild) / 2;

    node.x = childrenCenter - nodeWidth / 2;

    if (node.x < x - nodeWidth - minHorizontalGap) {
      node.x = x;
    }

    minX.value = Math.max(minX.value, node.x + nodeWidth + minHorizontalGap);
  };

  const renderConnectors = (node: TreeNode): JSX.Element[] => {
    const connectors: JSX.Element[] = [];
    const nodeWidth = 180;
    const nodeHeight = 90;

    if (node.children.length === 0) return connectors;

    // Parent center point
    const parentCenterX = node.x + nodeWidth / 2;
    const parentBottomY = node.y + nodeHeight;

    // Distance from parent to children
    const verticalGap = 50;

    // Vertical line from parent down
    connectors.push(
      <line
        key={`vert-${node.member.id}`}
        x1={parentCenterX}
        y1={parentBottomY}
        x2={parentCenterX}
        y2={parentBottomY + verticalGap}
        stroke="#4f46e5"
        strokeWidth="3"
        strokeLinecap="round"
      />
    );

    // Child center positions
    const childCenters = node.children.map((c) => c.x + nodeWidth / 2);
    const minChildCenter = Math.min(...childCenters);
    const maxChildCenter = Math.max(...childCenters);

    // Horizontal line connecting all children
    if (node.children.length > 1) {
      connectors.push(
        <line
          key={`horiz-${node.member.id}`}
          x1={minChildCenter}
          y1={parentBottomY + verticalGap}
          x2={maxChildCenter}
          y2={parentBottomY + verticalGap}
          stroke="#4f46e5"
          strokeWidth="3"
          strokeLinecap="round"
        />
      );
    }

    // Lines from horizontal bar to each child
    node.children.forEach((child) => {
      const childCenterX = child.x + nodeWidth / 2;
      connectors.push(
        <line
          key={`child-${child.member.id}`}
          x1={childCenterX}
          y1={parentBottomY + verticalGap}
          x2={childCenterX}
          y2={child.y}
          stroke="#4f46e5"
          strokeWidth="3"
          strokeLinecap="round"
        />
      );

      connectors.push(...renderConnectors(child));
    });

    return connectors;
  };

  const renderTreeNodesInSVG = (node: TreeNode): JSX.Element[] => {
    const elements: JSX.Element[] = [];
    const nodeWidth = 180;
    const nodeHeight = 90;
    const cornerRadius = 12;

    // Render node as SVG rect and text
    const genderColor = node.member.gender === 'male' ? '#4ade80' : node.member.gender === 'female' ? '#f472b6' : '#9ca3af';

    elements.push(
      <g key={`node-${node.member.id}`}>
        {/* Background rect */}
        <rect
          x={node.x}
          y={node.y}
          width={nodeWidth}
          height={nodeHeight}
          rx={cornerRadius}
          ry={cornerRadius}
          fill={genderColor}
          stroke="#374151"
          strokeWidth="2"
          opacity="0.95"
          style={{ cursor: 'pointer' }}
          onClick={() => setSelectedId(node.member.id)}
        />
        {/* Name text */}
        <text
          x={node.x + nodeWidth / 2}
          y={node.y + 30}
          textAnchor="middle"
          fill="white"
          fontSize="14"
          fontWeight="bold"
          style={{ cursor: 'pointer', pointerEvents: 'none' }}
        >
          {node.member.name}
        </text>
        {/* Gender symbol */}
        <text
          x={node.x + nodeWidth / 2}
          y={node.y + 50}
          textAnchor="middle"
          fill="white"
          fontSize="12"
          style={{ cursor: 'pointer', pointerEvents: 'none' }}
        >
          {node.member.gender === 'male' ? '♂ Boy' : node.member.gender === 'female' ? '♀ Girl' : '?'}
        </text>
        {/* Birth year */}
        {node.member.birthYear && (
          <text
            x={node.x + nodeWidth / 2}
            y={node.y + 65}
            textAnchor="middle"
            fill="white"
            fontSize="11"
            opacity="0.9"
            style={{ cursor: 'pointer', pointerEvents: 'none' }}
          >
            b. {node.member.birthYear}
          </text>
        )}
      </g>
    );

    // Render children
    node.children.forEach((child) => {
      elements.push(...renderTreeNodesInSVG(child));
    });

    return elements;
  };

  let treeLayout = rootId ? calculateTreeLayout(rootId) : null;
  const maxX = { value: 0 };
  if (treeLayout) {
    const minX = { value: 50 };
    layoutTree(treeLayout, 50, minX);
    maxX.value = minX.value; // Get the rightmost position
  }

  // Calculate height based on deepest node + padding
  const calculateMaxDepth = (node: TreeNode | null): number => {
    if (!node) return 0;
    if (node.children.length === 0) return node.y;
    return Math.max(node.y, ...node.children.map(calculateMaxDepth));
  };

  const maxDepth = treeLayout ? calculateMaxDepth(treeLayout) : 0;
  const svgHeight = Math.max(800, maxDepth + 200);
  const svgWidth = Math.max(1400, maxX.value + 100); // Dynamic width based on actual tree

  const exportToImage = async (format: 'png' | 'pdf') => {
    if (!svgRef.current) return;

    try {
      const svg = svgRef.current;
      
      // Convert SVG to canvas directly
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context failed');

      const scale = 2;
      canvas.width = svgWidth * scale;
      canvas.height = svgHeight * scale;

      // Fill with white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw SVG onto canvas
      const svgData = new XMLSerializer().serializeToString(svg);
      const img = new window.Image();
      img.onload = async () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        if (format === 'png') {
          // Download PNG
          canvas.toBlob((blob) => {
            if (!blob) return;
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `family-tree-${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            alert('PNG downloaded! Check your Downloads folder.');
          }, 'image/png', 1.0);
        } else if (format === 'pdf') {
          // Download PDF
          canvas.toBlob((blob) => {
            if (!blob) return;
            const reader = new FileReader();
            reader.onload = () => {
              const imgData = reader.result as string;
              const pdf = new jsPDF({
                orientation: svgWidth > svgHeight ? 'landscape' : 'portrait',
                unit: 'mm',
                format: 'a4',
              });

              const pdfWidth = pdf.internal.pageSize.getWidth();
              const pdfHeight = pdf.internal.pageSize.getHeight();
              const margin = 10;
              const availWidth = pdfWidth - 2 * margin;
              const ratio = svgHeight / svgWidth;
              let imgHeight = availWidth * ratio;
              let yPosition = margin;

              pdf.addImage(imgData, 'PNG', margin, yPosition, availWidth, imgHeight);
              let heightLeft = imgHeight - pdfHeight;

              while (heightLeft > 0) {
                yPosition = heightLeft - imgHeight + margin;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', margin, yPosition, availWidth, imgHeight);
                heightLeft -= pdfHeight;
              }

              pdf.save(`family-tree-${Date.now()}.pdf`);
              alert('PDF downloaded! Check your Downloads folder.');
            };
            reader.readAsDataURL(blob);
          }, 'image/png', 1.0);
        }
      };
      img.onerror = () => {
        throw new Error('Failed to load SVG image');
      };
      
      // Create blob URL for SVG
      const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      img.src = url;
    } catch (error) {
      console.error('[v0] Export error:', error);
      alert('Export error: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const exportToJSON = () => {
    const data = JSON.stringify({ members, rootId }, null, 2);
    const link = document.createElement('a');
    link.href = 'data:application/json;charset=utf-8,' + encodeURIComponent(data);
    link.download = `family-tree-${Date.now()}.json`;
    link.click();
  };

  if (!rootId) {
    return (
      <div className="p-8 bg-gradient-to-br from-indigo-50 to-blue-50 min-h-screen">
        <Card className="max-w-md mx-auto p-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Family Tree Builder</h1>
          <p className="text-gray-600">Loading...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Family Tree Builder</h1>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => setIsTreeView(false)} variant={!isTreeView ? 'default' : 'outline'}>
              Editor View
            </Button>
            <Button onClick={() => setIsTreeView(true)} variant={isTreeView ? 'default' : 'outline'}>
              Tree View
            </Button>
            <Button onClick={() => exportToJSON()} variant="outline" size="sm" title="Export family data as JSON">
              <FileJson className="w-4 h-4 mr-2" />
              JSON
            </Button>
            <Button onClick={() => exportToImage('png')} variant="outline" size="sm" title="Export tree as PNG image">
              <ImageIcon className="w-4 h-4 mr-2" />
              PNG
            </Button>
            <Button onClick={() => exportToImage('pdf')} variant="outline" size="sm" title="Export as PDF document">
              <FileText className="w-4 h-4 mr-2" />
              PDF
            </Button>
          </div>
        </div>

        {isTreeView ? (
          // Tree View with SVG
          <div className="mb-8">
            <Card className="p-8 bg-white shadow-lg">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Family Tree Diagram</h2>
                <div className="flex gap-2 items-center">
                  <Button onClick={() => setZoom(Math.max(0.2, zoom - 0.15))} size="sm" variant="outline">− Zoom</Button>
                  <span className="px-3 py-2 text-sm font-semibold font-mono w-16 text-center">{Math.round(zoom * 100)}%</span>
                  <Button onClick={() => setZoom(Math.min(3, zoom + 0.15))} size="sm" variant="outline">+ Zoom</Button>
                  <Button onClick={() => setZoom(0.3)} size="sm" variant="outline" title="Fit entire tree in view">Fit All</Button>
                  <Button onClick={() => exportToImage('png')} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Download className="w-4 h-4 mr-2" />
                    PNG
                  </Button>
                  <Button onClick={() => exportToImage('pdf')} size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                    <Download className="w-4 h-4 mr-2" />
                    PDF
                  </Button>
                </div>
              </div>
              <div
                ref={treeViewRef}
                className="overflow-auto bg-gradient-to-b from-blue-50 to-indigo-50 p-4 rounded-lg border-2 border-gray-200"
                style={{ maxHeight: `calc(100vh - 320px)`, minHeight: '650px', width: '100%' }}
              >
                <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', display: 'inline-block', minWidth: '100%' }}>
                  <svg
                    ref={svgRef}
                    width={svgWidth}
                    height={svgHeight}
                    style={{ display: 'block', backgroundColor: '#ffffff', minWidth: '100%' }}
                    className="rounded shadow"
                    viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                  >
                    <defs>
                      <style>{`
                        rect:hover { opacity: 0.85 !important; cursor: pointer; }
                        text { user-select: none; }
                        line { stroke-linejoin: round; }
                      `}</style>
                    </defs>
                    {treeLayout && renderConnectors(treeLayout)}
                    {treeLayout && renderTreeNodesInSVG(treeLayout)}
                  </svg>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-6">
                <span className="inline-block mr-6">Green = Male</span>
                <span className="inline-block">Pink = Female</span>
              </p>
            </Card>
          </div>
        ) : (
          // Editor View
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card className="p-6 shadow-lg">
                <h2 className="text-2xl font-bold mb-6 text-gray-800">Family Members</h2>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {Object.values(members).map((member) => (
                    <div
                      key={member.id}
                      onClick={() => setSelectedId(member.id)}
                      className={`p-4 rounded-lg cursor-pointer border-2 transition-all ${
                        selectedId === member.id ? 'bg-indigo-100 border-indigo-600' : 'bg-white border-gray-200 hover:border-indigo-400'
                      } ${getGenderColor(member.gender)}`}
                    >
                      <div className="font-semibold text-gray-900">
                        {member.name}
                        {member.gender === 'male' ? ' (♂)' : member.gender === 'female' ? ' (♀)' : ''}
                      </div>
                      {member.birthYear && <div className="text-xs text-gray-600">{member.birthYear}</div>}
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <div>
              {selectedMember ? (
                <Card className="p-6 shadow-lg sticky top-24">
                  <h2 className="text-xl font-bold mb-4 text-gray-800">{selectedMember.name}</h2>

                  {!isEditing ? (
                    <>
                      <div className="space-y-2 text-sm text-gray-700 mb-4">
                        <div>
                          <span className="font-semibold">Gender:</span> {selectedMember.gender === 'male' ? '♂ Male' : selectedMember.gender === 'female' ? '♀ Female' : 'Not specified'}
                        </div>
                        {selectedMember.birthYear && (
                          <div>
                            <span className="font-semibold">Born:</span> {selectedMember.birthYear}
                          </div>
                        )}
                        {selectedMember.deathYear && (
                          <div>
                            <span className="font-semibold">Died:</span> {selectedMember.deathYear}
                          </div>
                        )}
                        {selectedMember.occupation && (
                          <div>
                            <span className="font-semibold">Occupation:</span> {selectedMember.occupation}
                          </div>
                        )}
                        {selectedMember.location && (
                          <div>
                            <span className="font-semibold">Location:</span> {selectedMember.location}
                          </div>
                        )}
                        {selectedMember.bio && (
                          <div>
                            <span className="font-semibold">Bio:</span> {selectedMember.bio}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 mb-4">
                        <Button onClick={() => { setIsEditing(true); setIsAddingChild(false); }} size="sm" className="flex-1">
                          <Edit2 className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        <Button onClick={() => { setIsEditing(true); setIsAddingChild(true); }} size="sm" className="flex-1" variant="outline">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Child
                        </Button>
                        {selectedMember.id !== rootId && (
                          <Button onClick={() => deleteMember(selectedMember.id)} size="sm" variant="destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-3">
                        <input
                          type="text"
                          placeholder="Name"
                          value={editingMember?.name || selectedMember.name}
                          onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                          className="w-full px-3 py-2 border rounded-lg text-sm"
                        />
                        <select
                          value={editingMember?.gender || selectedMember.gender || 'male'}
                          onChange={(e) => setEditingMember({ ...editingMember, gender: e.target.value as 'male' | 'female' })}
                          className="w-full px-3 py-2 border rounded-lg text-sm"
                        >
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                        </select>
                        <input
                          type="number"
                          placeholder="Birth Year"
                          value={editingMember?.birthYear || selectedMember.birthYear || ''}
                          onChange={(e) => setEditingMember({ ...editingMember, birthYear: parseInt(e.target.value) || undefined })}
                          className="w-full px-3 py-2 border rounded-lg text-sm"
                        />
                        <input
                          type="number"
                          placeholder="Death Year (optional)"
                          value={editingMember?.deathYear || selectedMember.deathYear || ''}
                          onChange={(e) => setEditingMember({ ...editingMember, deathYear: parseInt(e.target.value) || undefined })}
                          className="w-full px-3 py-2 border rounded-lg text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Occupation"
                          value={editingMember?.occupation || selectedMember.occupation || ''}
                          onChange={(e) => setEditingMember({ ...editingMember, occupation: e.target.value })}
                          className="w-full px-3 py-2 border rounded-lg text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Location"
                          value={editingMember?.location || selectedMember.location || ''}
                          onChange={(e) => setEditingMember({ ...editingMember, location: e.target.value })}
                          className="w-full px-3 py-2 border rounded-lg text-sm"
                        />
                        <textarea
                          placeholder="Bio"
                          value={editingMember?.bio || selectedMember.bio || ''}
                          onChange={(e) => setEditingMember({ ...editingMember, bio: e.target.value })}
                          className="w-full px-3 py-2 border rounded-lg text-sm"
                          rows={3}
                        />
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button
                          onClick={() => {
                            if (isAddingChild) {
                              addMember(selectedMember.id, editingMember || { name: 'New Member' });
                              setIsEditing(false);
                              setEditingMember(null);
                              setIsAddingChild(false);
                            } else {
                              updateMember(selectedMember.id, editingMember || {});
                              setIsEditing(false);
                              setEditingMember(null);
                            }
                          }}
                          size="sm"
                          className="flex-1"
                        >
                          {isAddingChild ? 'Create Child' : 'Save'}
                        </Button>
                        <Button
                          onClick={() => {
                            setIsEditing(false);
                            setEditingMember(null);
                          }}
                          size="sm"
                          variant="outline"
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                      </div>
                    </>
                  )}
                </Card>
              ) : (
                <Card className="p-6 text-center text-gray-500">Select a member to view details</Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
