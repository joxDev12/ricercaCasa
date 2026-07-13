exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable("listing_images", {
    id: "id",
    listing_id: {
      type: "bigint",
      notNull: true,
      references: "saved_listings",
      onDelete: "CASCADE",
    },
    image_url: { type: "text", notNull: true },
    alt_text: { type: "text" },
    position: { type: "integer", notNull: true, default: 0 },
    is_primary: { type: "boolean", notNull: true, default: false },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });

  pgm.addConstraint("listing_images", "listing_images_listing_id_image_url_uq", {
    unique: ["listing_id", "image_url"],
  });
  pgm.addConstraint("listing_images", "listing_images_position_ck", {
    check: "position >= 0",
  });
  pgm.createIndex("listing_images", ["listing_id", "position"], {
    name: "listing_images_listing_position_idx",
  });
};

exports.down = (pgm) => {
  pgm.dropTable("listing_images");
};
