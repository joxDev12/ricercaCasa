exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable("scraping_runs", {
    id: "id",
    source_id: {
      type: "bigint",
      notNull: true,
      references: "sources",
      onDelete: "RESTRICT",
    },
    operation: { type: "varchar(30)", notNull: true },
    criteria: { type: "jsonb", notNull: true, default: pgm.func("'{}'::jsonb") },
    status: { type: "varchar(20)", notNull: true },
    results_count: { type: "integer" },
    duration_ms: { type: "integer" },
    error_code: { type: "varchar(100)" },
    error_message: { type: "text" },
    started_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
    completed_at: { type: "timestamptz" },
  });

  pgm.addConstraint("scraping_runs", "scraping_runs_operation_ck", {
    check: "operation IN ('search', 'detail')",
  });
  pgm.addConstraint("scraping_runs", "scraping_runs_status_ck", {
    check: "status IN ('running', 'success', 'failed', 'blocked')",
  });
  pgm.createIndex("scraping_runs", "started_at", { name: "scraping_runs_started_at_idx" });
  pgm.createIndex("scraping_runs", "status", { name: "scraping_runs_status_idx" });
};

exports.down = (pgm) => {
  pgm.dropTable("scraping_runs");
};
