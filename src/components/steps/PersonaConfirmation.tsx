import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PersonaList from "@/components/PersonaList";

interface PersonaConfirmationProps {
  personas: string[];
  onNext: () => void;
}

const PersonaConfirmation = ({ personas, onNext }: PersonaConfirmationProps) => {
  return (
    <div className="space-y-4">
      <Card className="p-8 backdrop-blur-md bg-white/30 border border-white/20 shadow-xl">
        <PersonaList personas={personas} />
      </Card>
      <div className="flex justify-end">
        <Button
          onClick={onNext}
          className="bg-black text-white hover:bg-black/80 transition-colors"
        >
          次へ進む
        </Button>
      </div>
    </div>
  );
};

export default PersonaConfirmation;