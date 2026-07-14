exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable("user_preferences", {
    id: { type: "smallint", primaryKey: true },
    display_name: { type: "varchar(120)" },
    contact_email: { type: "varchar(320)" },
    locale: { type: "varchar(20)", notNull: true, default: "it-IT" },
    timezone: { type: "varchar(100)", notNull: true, default: "Europe/Rome" },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
  });

  pgm.addConstraint("user_preferences", "user_preferences_singleton_check", {
    check: "id = 1",
  });
  pgm.addConstraint("user_preferences", "user_preferences_display_name_check", {
    check:
      "display_name IS NULL OR char_length(trim(display_name)) BETWEEN 1 AND 120",
  });

  pgm.sql(`
    INSERT INTO user_preferences (id, locale, timezone)
    VALUES (1, 'it-IT', 'Europe/Rome')
    ON CONFLICT (id) DO NOTHING;
  `);
};

exports.down = (pgm) => {
  pgm.dropTable("user_preferences");
};
