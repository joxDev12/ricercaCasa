exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.addColumns("saved_listings", {
    property_group_id: { type: "bigint" },
    normalized_address: { type: "text" },
    normalized_location_key: { type: "varchar(500)" },
    dedupe_fingerprint: { type: "varchar(128)" },
    dedupe_data: {
      type: "jsonb",
      notNull: true,
      default: pgm.func("'{}'::jsonb"),
    },
  });

  pgm.createIndex("saved_listings", "property_group_id", {
    name: "saved_listings_property_group_id_idx",
    where: "property_group_id IS NOT NULL",
  });
  pgm.createIndex("saved_listings", "normalized_location_key", {
    name: "saved_listings_normalized_location_key_idx",
    where: "normalized_location_key IS NOT NULL",
  });
  pgm.createIndex("saved_listings", "dedupe_fingerprint", {
    name: "saved_listings_dedupe_fingerprint_idx",
    where: "dedupe_fingerprint IS NOT NULL",
  });
};

exports.down = (pgm) => {
  pgm.dropColumns("saved_listings", [
    "property_group_id",
    "normalized_address",
    "normalized_location_key",
    "dedupe_fingerprint",
    "dedupe_data",
  ]);
};
