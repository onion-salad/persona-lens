import { Card } from "@/components/ui/card";

interface PersonaListProps {
  personas: string[];
}

const PersonaList = ({ personas }: PersonaListProps) => {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {personas.map((persona, index) => (
        <Card key={index} className="p-4">
          <div className="flex items-start space-x-4">
            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
              <span className="text-indigo-600 font-semibold">
                {index + 1}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-600">{persona}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default PersonaList;