exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
    INSERT INTO sources (code, name, base_url, active)
    VALUES
      ('idealista_it', 'Idealista', 'https://www.idealista.it', true),
      ('casa_it', 'Casa.it', 'https://www.casa.it', true)
    ON CONFLICT (code) DO NOTHING
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DELETE FROM sources
    WHERE code IN ('idealista_it', 'casa_it')
      AND NOT EXISTS (
        SELECT 1
        FROM saved_listings sl
        WHERE sl.source_id = sources.id
      )
      AND NOT EXISTS (
        SELECT 1
        FROM scraping_runs sr
        WHERE sr.source_id = sources.id
      )
  `);
};
