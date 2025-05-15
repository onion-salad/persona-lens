ALTER TABLE public.expert_personas
ADD COLUMN additional_notes TEXT NULL;

COMMENT ON COLUMN public.expert_personas.additional_notes IS '''User-added additional notes or details about the persona, for free-form text.'''; 