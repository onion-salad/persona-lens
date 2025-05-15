CREATE OR REPLACE FUNCTION get_ids_by_array_partial_match(
    p_field_name TEXT,
    p_keyword TEXT
)
RETURNS TABLE(id UUID) AS $$
BEGIN
    RETURN QUERY EXECUTE format(
        'SELECT ep.id FROM expert_personas ep WHERE EXISTS (SELECT 1 FROM UNNEST(ep.%I) AS item WHERE item ILIKE %L)',
        p_field_name,
        '%' || p_keyword || '%'
    );
END;
$$ LANGUAGE plpgsql; 