exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable("app_installation", {
    id: { type: "smallint", primaryKey: true },
    installation_uuid: { type: "varchar(36)", notNull: true, unique: true },
    setup_status: { type: "varchar(20)", notNull: true, default: "pending" },
    installed_version: { type: "varchar(32)" },
    last_successful_version: { type: "varchar(32)" },
    setup_completed_at: { type: "timestamptz" },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
  });

  pgm.addConstraint("app_installation", "app_installation_singleton_check", {
    check: "id = 1",
  });
  pgm.addConstraint("app_installation", "app_installation_setup_status_check", {
    check: "setup_status IN ('pending', 'in_progress', 'completed', 'failed')",
  });

  pgm.sql(`
    INSERT INTO app_installation (id, installation_uuid, setup_status)
    VALUES (
      1,
      (
        substr(md5(random()::text || clock_timestamp()::text), 1, 8) || '-' ||
        substr(md5(random()::text || clock_timestamp()::text), 1, 4) || '-' ||
        substr(md5(random()::text || clock_timestamp()::text), 1, 4) || '-' ||
        substr(md5(random()::text || clock_timestamp()::text), 1, 4) || '-' ||
        substr(md5(random()::text || clock_timestamp()::text), 1, 12)
      ),
      'pending'
    )
    ON CONFLICT (id) DO NOTHING;
  `);
};

exports.down = (pgm) => {
  pgm.dropTable("app_installation");
};
