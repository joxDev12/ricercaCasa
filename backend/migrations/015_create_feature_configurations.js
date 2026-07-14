exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable("feature_configurations", {
    id: { type: "bigserial", primaryKey: true },
    feature_code: { type: "varchar(100)", notNull: true },
    schema_version: { type: "integer", notNull: true },
    status: { type: "varchar(20)", notNull: true, default: "pending" },
    configuration: { type: "jsonb", notNull: true, default: pgm.func("'{}'::jsonb") },
    configured_at: { type: "timestamptz" },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
  });

  pgm.addConstraint(
    "feature_configurations",
    "feature_configurations_feature_code_schema_version_uq",
    {
      unique: ["feature_code", "schema_version"],
    }
  );
  pgm.addConstraint("feature_configurations", "feature_configurations_schema_version_check", {
    check: "schema_version > 0",
  });
  pgm.addConstraint("feature_configurations", "feature_configurations_status_check", {
    check: "status IN ('pending', 'configured', 'disabled', 'invalid')",
  });
  pgm.addConstraint("feature_configurations", "feature_configurations_configuration_check", {
    check: "jsonb_typeof(configuration) = 'object'",
  });
  pgm.createIndex("feature_configurations", ["status"], {
    name: "feature_configurations_status_idx",
  });
};

exports.down = (pgm) => {
  pgm.dropTable("feature_configurations");
};
