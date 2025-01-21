import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart2, Trash2 } from "lucide-react";

interface ProjectCardProps {
  id: string;
  name: string;
  description: string | null;
  totalScans: number;
  selectedProjectId: string | null;
  onProjectSelect: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>, projectId: string) => void;
}

export const ProjectCard = ({
  id,
  name,
  description,
  totalScans,
  selectedProjectId,
  onProjectSelect,
  onDeleteProject,
  onDragOver,
  onDragLeave,
  onDrop,
}: ProjectCardProps) => {
  return (
    <Card
      className={`cursor-pointer transition-colors ${
        selectedProjectId === id ? "ring-2 ring-primary" : ""
      }`}
      onClick={() => onProjectSelect(id)}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, id)}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{name}</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteProject(id);
            }}
          >
            <Trash2 className="h-4 w-4 text-gray-500 hover:text-red-500" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {description && (
          <p className="text-sm text-gray-600 mb-2">{description}</p>
        )}
        <div className="flex items-center text-sm text-gray-600">
          <BarChart2 className="h-4 w-4 mr-2" />
          <span>{totalScans} total scans</span>
        </div>
      </CardContent>
    </Card>
  );
};