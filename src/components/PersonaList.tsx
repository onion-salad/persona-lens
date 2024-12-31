import { Card } from "@/components/ui/card";

interface PersonaListProps {
  personas: string[];
}

const PersonaList = ({ personas }: PersonaListProps) => {
  if (personas.length === 0) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900">生成されたペルソナ</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {personas.map((persona, index) => (
          <Card key={index} className="p-4">
            <p className="text-gray-700">{persona}</p>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PersonaList;