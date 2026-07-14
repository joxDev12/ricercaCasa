exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable("application_updates", {
    id: { type: "bigserial", primaryKey: true },
    job_id: { type: "varchar(100)", notNull: true, unique: true },
    from_version: { type: "varchar(32)" },
    to_version: { type: "varchar(32)", notNull: true },
    updater_from_version: { type: "varchar(32)" },
    updater_to_version: { type: "varchar(32)" },
    status: { type: "varchar(20)", notNull: true },
    release_digest: { type: "varchar(128)" },
    backup_created: { type: "boolean", notNull: true, default: false },
    rollback_performed: { type: "boolean", notNull: true, default: false },
    failure_code: { type: "varchar(100)" },
    failure_message: { type: "text" },
    started_at: { type: "timestamptz", notNull: true },
    completed_at: { type: "timestamptz" },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
  });

  pgm.addConstraint("application_updates", "application_updates_status_check", {
    check: "status IN ('pending', 'running', 'succeeded', 'failed', 'rolled_back', 'cancelled')",
  });
  pgm.createIndex("application_updates", ["started_at"], {
    name: "application_updates_started_at_idx",
  });
  pgm.createIndex("application_updates", ["status"], {
    name: "application_updates_status_idx",
  });
};

exports.down = (pgm) => {
  pgm.dropTable("application_updates");
};
