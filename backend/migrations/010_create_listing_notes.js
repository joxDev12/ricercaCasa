exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable("listing_notes", {
    id: "id",
    property_group_id: {
      type: "bigint",
      notNull: true,
      references: "property_groups",
      onDelete: "CASCADE",
    },
    body: { type: "text", notNull: true },
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

  pgm.addConstraint("listing_notes", "listing_notes_body_present_ck", {
    check: "length(btrim(body)) > 0",
  });
  pgm.addConstraint("listing_notes", "listing_notes_body_length_ck", {
    check: "char_length(body) <= 10000",
  });
  pgm.createIndex("listing_notes", ["property_group_id", "created_at"], {
    name: "listing_notes_group_created_at_idx",
    order: { created_at: "DESC" },
  });
};

exports.down = (pgm) => {
  pgm.dropTable("listing_notes");
};
