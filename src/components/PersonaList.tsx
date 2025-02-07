
import { Card } from "@/components/ui/card";

interface PersonaListProps {
  personas: string[];
}

const PersonaList = ({ personas }: PersonaListProps) => {
  if (personas.length === 0) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900">生成されたペルソナ</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {personas.map((persona, index) => (
          <Card key={index} className="p-6 bg-white/30 backdrop-blur-md shadow-lg border border-white/20">
            <h3 className="font-semibold text-lg text-black mb-2">ペルソナ {index + 1}</h3>
            <p className="text-gray-700">{persona}</p>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PersonaList;
