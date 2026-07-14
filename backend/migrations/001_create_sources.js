exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable("sources", {
    id: "id",
    code: { type: "varchar(50)", notNull: true, unique: true },
    name: { type: "varchar(120)", notNull: true },
    base_url: { type: "text", notNull: true },
    active: { type: "boolean", notNull: true, default: true },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
    updated_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });

  pgm.sql(`
    INSERT INTO sources (code, name, base_url, active)
    VALUES ('immobiliare_it', 'Immobiliare.it', 'https://www.immobiliare.it', true)
  `);
};

exports.down = (pgm) => {
  pgm.dropTable("sources");
};
