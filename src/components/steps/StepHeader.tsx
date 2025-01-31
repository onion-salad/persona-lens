import { FC } from 'react';

const StepHeader: FC = () => {
  return (
    <div className="text-center mb-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">
        Persona Lens
      </h1>
      <p className="text-lg text-gray-600">
        多様なペルソナの視点からファーストビューの評価を得られます
      </p>
    </div>
  );
};

export default StepHeader;