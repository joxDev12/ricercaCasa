exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable("listing_appointments", {
    id: "id",
    property_group_id: {
      type: "bigint",
      notNull: true,
      references: "property_groups",
      onDelete: "CASCADE",
    },
    scheduled_at: { type: "timestamptz", notNull: true },
    status: { type: "varchar(20)", notNull: true, default: "scheduled" },
    location_text: { type: "varchar(500)" },
    notes: { type: "text" },
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

  pgm.addConstraint(
    "listing_appointments",
    "listing_appointments_status_ck",
    {
      check: "status IN ('scheduled', 'completed', 'cancelled')",
    }
  );
  pgm.addConstraint(
    "listing_appointments",
    "listing_appointments_location_text_length_ck",
    {
      check: "location_text IS NULL OR char_length(location_text) <= 500",
    }
  );
  pgm.addConstraint(
    "listing_appointments",
    "listing_appointments_notes_length_ck",
    {
      check: "notes IS NULL OR char_length(notes) <= 5000",
    }
  );

  pgm.createIndex("listing_appointments", ["property_group_id", "scheduled_at"], {
    name: "listing_appointments_group_scheduled_at_idx",
  });
  pgm.createIndex("listing_appointments", ["status", "scheduled_at"], {
    name: "listing_appointments_status_scheduled_at_idx",
  });
};

exports.down = (pgm) => {
  pgm.dropTable("listing_appointments");
};
