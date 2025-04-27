
import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PersonaCard } from "./persona-card";
import { Button } from "@/components/ui/button";

// PersonaCardコンポーネントが想定しているPersona型に合わせて定義
interface Persona {
  id: string;
  name: string;
  age: number;
  gender: string;
  occupation: string;
  location: string;
  family: string;
  background: string;
  personality: string;
  dailyLife: string;
  techUsage: string;
  consumptionBehavior: string;
  goalsAndChallenges: string;
  relationToProduct: string;
  income?: string;
  interests?: string[];
}

export const PersonaGrid = ({ personas = [] }: { personas: Persona[] }) => {
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGender, setFilterGender] = useState("All");

  const handlePersonaClick = (persona: Persona) => {
    // Handle click
    console.log("Clicked persona:", persona);
  };

  const handleSelectPersona = (id: string) => {
    setSelectedPersonas((prev) =>
      prev.includes(id) ? prev.filter((personaId) => personaId !== id) : [...prev, id]
    );
  };

  const filteredPersonas = personas.filter((persona) => {
    const searchMatch =
      persona.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      persona.occupation.toLowerCase().includes(searchTerm.toLowerCase());
    const genderMatch = filterGender === "All" || persona.gender === filterGender;
    return searchMatch && genderMatch;
  });

  const totalPages = Math.ceil(filteredPersonas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const placeholderCards = Array(itemsPerPage - (endIndex - startIndex)).fill(null);

  return (
    <div className="space-y-4 w-full">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">AIペルソナ</h2>
        <div className="flex items-center space-x-4">
          <input
            type="text"
            placeholder="Search personas..."
            className="border rounded-md px-2 py-1"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className="border rounded-md px-2 py-1"
            value={filterGender}
            onChange={(e) => setFilterGender(e.target.value)}
          >
            <option value="All">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredPersonas.slice(startIndex, endIndex).map((persona) => (
          <motion.div
            key={persona.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className={`${
              selectedPersonas.includes(persona.id) ? "ring-2 ring-primary" : ""
            }`}
          >
            <PersonaCard
              persona={persona}
              isSelected={selectedPersonas.includes(persona.id)}
              onSelect={() => handleSelectPersona(persona.id)}
              onClick={() => handlePersonaClick(persona)}
            />
          </motion.div>
        ))}
        {placeholderCards.map((_, i) => (
          <div
            key={`placeholder-${i}`}
            className="border rounded-md p-4 bg-gray-100 animate-pulse"
          >
            {/* Placeholder card */}
          </div>
        ))}
      </div>
      
      <div className="flex items-center justify-between">
        <Button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          variant="outline"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>
        <span>
          Page {currentPage} of {totalPages || 1}
        </span>
        <Button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages || totalPages === 0}
          variant="outline"
        >
          Next
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};
