'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { FamilyMember } from '@/types/family';
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch';
import { Button } from '@/components/ui/button';

interface TreeDiagramProps {
  members: Record<string, FamilyMember>;
  rootId: string;
  onSelectMember: (memberId: string) => void;
  selectedMemberId?: string;
}

interface TreeNode extends d3.HierarchyNode<FamilyMember> {
  x: number;
  y: number;
  depth: number;
  children?: TreeNode[];
}

export default function TreeDiagram({
  members,
  rootId,
  onSelectMember,
  selectedMemberId,
}: TreeDiagramProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 });

  useEffect(() => {
    if (!svgRef.current || !members[rootId]) return;

    const buildHierarchy = (memberId: string): d3.HierarchyNode<FamilyMember> => {
      const member = members[memberId];
      const children = member.childrenIds
        .map(childId => buildHierarchy(childId))
        .filter(Boolean);

      return d3.hierarchy(member, () => children as any);
    };

    const root = buildHierarchy(rootId);
    
    // Calculate tree layout
    const treeLayout = d3.tree<FamilyMember>()
      .size([dimensions.width, dimensions.height])
      .separation((a, b) => (a.parent === b.parent ? 1 : 2));

    const hierarchy = treeLayout(root);
    const nodes = hierarchy.descendants();
    const links = hierarchy.links();

    // Clear previous content
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Create main group
    const g = svg
      .attr('width', dimensions.width)
      .attr('height', dimensions.height)
      .append('g')
      .attr('transform', 'translate(50,50)');

    // Draw links
    g.selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('x1', d => (d.source as any).x)
      .attr('y1', d => (d.source as any).y)
      .attr('x2', d => (d.target as any).x)
      .attr('y2', d => (d.target as any).y)
      .attr('stroke', '#999')
      .attr('stroke-width', 2);

    // Draw nodes
    const nodeGroups = g.selectAll('g.node')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${(d as any).x},${(d as any).y})`)
      .style('cursor', 'pointer');

    // Circle background
    nodeGroups
      .append('circle')
      .attr('r', 30)
      .attr('fill', d => selectedMemberId === (d.data as FamilyMember).id ? '#3b82f6' : '#e5e7eb')
      .attr('stroke', d => selectedMemberId === (d.data as FamilyMember).id ? '#1f2937' : '#999')
      .attr('stroke-width', 2);

    // Text
    nodeGroups
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .style('pointer-events', 'none')
      .text(d => {
        const name = (d.data as FamilyMember).name;
        return name.split(' ')[0]; // First name only
      });

    // Click handler
    nodeGroups.on('click', (event, d) => {
      event.stopPropagation();
      onSelectMember((d.data as FamilyMember).id);
    });

  }, [members, rootId, selectedMemberId, onSelectMember, dimensions]);

  return (
    <div className="w-full h-full bg-white rounded-lg overflow-hidden border">
      <div className="flex gap-2 p-4 bg-gray-50 border-b">
        <Button variant="outline" size="sm" onClick={() => {
          if (svgRef.current) {
            const svg = d3.select(svgRef.current);
            svg.transition().duration(750).attr('transform', 'translate(0,0) scale(1)');
          }
        }}>
          Reset Zoom
        </Button>
      </div>
      <div className="w-full" style={{ height: 'calc(100% - 60px)' }}>
        <TransformWrapper initialScale={1} initialPositionX={0} initialPositionY={0}>
          <TransformComponent>
            <svg
              ref={svgRef}
              className="bg-white"
              style={{ minWidth: '100%', minHeight: '100%' }}
            />
          </TransformComponent>
        </TransformWrapper>
      </div>
    </div>
  );
}
