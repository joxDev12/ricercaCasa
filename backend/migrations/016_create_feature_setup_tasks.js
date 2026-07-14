exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable("feature_setup_tasks", {
    id: { type: "bigserial", primaryKey: true },
    feature_code: { type: "varchar(100)", notNull: true },
    schema_version: { type: "integer", notNull: true },
    required_from_version: { type: "varchar(32)", notNull: true },
    blocking: { type: "boolean", notNull: true, default: false },
    status: { type: "varchar(20)", notNull: true, default: "pending" },
    completed_at: { type: "timestamptz" },
    skipped_at: { type: "timestamptz" },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
  });

  pgm.addConstraint("feature_setup_tasks", "feature_setup_tasks_feature_code_schema_version_uq", {
    unique: ["feature_code", "schema_version"],
  });
  pgm.addConstraint("feature_setup_tasks", "feature_setup_tasks_schema_version_check", {
    check: "schema_version > 0",
  });
  pgm.addConstraint("feature_setup_tasks", "feature_setup_tasks_status_check", {
    check: "status IN ('pending', 'in_progress', 'completed', 'skipped', 'failed')",
  });
  pgm.addConstraint("feature_setup_tasks", "feature_setup_tasks_blocking_check", {
    check: "NOT blocking OR status <> 'skipped'",
  });
};

exports.down = (pgm) => {
  pgm.dropTable("feature_setup_tasks");
};
