exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable("duplicate_candidates", {
    id: "id",
    listing_a_id: {
      type: "bigint",
      notNull: true,
      references: "saved_listings",
      onDelete: "CASCADE",
    },
    listing_b_id: {
      type: "bigint",
      notNull: true,
      references: "saved_listings",
      onDelete: "CASCADE",
    },
    score: { type: "numeric(5,4)", notNull: true },
    status: { type: "varchar(30)", notNull: true, default: "pending" },
    reasons: {
      type: "jsonb",
      notNull: true,
      default: pgm.func("'[]'::jsonb"),
    },
    algorithm_version: { type: "integer", notNull: true, default: 1 },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
    resolved_at: { type: "timestamptz" },
    updated_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });

  pgm.addConstraint("duplicate_candidates", "duplicate_candidates_pair_uq", {
    unique: ["listing_a_id", "listing_b_id"],
  });
  pgm.addConstraint("duplicate_candidates", "duplicate_candidates_listing_order_ck", {
    check: "listing_a_id < listing_b_id",
  });
  pgm.addConstraint("duplicate_candidates", "duplicate_candidates_score_ck", {
    check: "score >= 0 AND score <= 1",
  });
  pgm.addConstraint("duplicate_candidates", "duplicate_candidates_status_ck", {
    check: "status IN ('pending', 'auto_confirmed', 'confirmed', 'rejected')",
  });

  pgm.createIndex("duplicate_candidates", ["status", "score"], {
    name: "duplicate_candidates_status_score_idx",
    order: { score: "DESC" },
  });
  pgm.createIndex("duplicate_candidates", "listing_a_id", {
    name: "duplicate_candidates_listing_a_idx",
  });
  pgm.createIndex("duplicate_candidates", "listing_b_id", {
    name: "duplicate_candidates_listing_b_idx",
  });
};

exports.down = (pgm) => {
  pgm.dropTable("duplicate_candidates");
};
