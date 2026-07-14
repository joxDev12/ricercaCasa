exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable("property_groups", {
    id: "id",
    transaction_type: { type: "varchar(20)", notNull: true },
    management_status: {
      type: "varchar(30)",
      notNull: true,
      default: "saved",
    },
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

  pgm.addConstraint("property_groups", "property_groups_transaction_type_ck", {
    check: "transaction_type IN ('rent', 'sale')",
  });
  pgm.addConstraint("property_groups", "property_groups_management_status_ck", {
    check: `
      management_status IN (
        'saved',
        'to_contact',
        'contacted',
        'appointment_scheduled',
        'visited',
        'discarded'
      )
    `,
  });

  pgm.createIndex("property_groups", "management_status", {
    name: "property_groups_status_idx",
  });
  pgm.createIndex("property_groups", "updated_at", {
    name: "property_groups_updated_at_idx",
    order: "DESC",
  });
};

exports.down = (pgm) => {
  pgm.dropTable("property_groups");
};
