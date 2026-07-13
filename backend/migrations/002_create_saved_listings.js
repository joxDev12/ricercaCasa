exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable("saved_listings", {
    id: "id",
    source_id: {
      type: "bigint",
      notNull: true,
      references: "sources",
      onDelete: "RESTRICT",
    },
    external_id: { type: "varchar(150)", notNull: true },
    source_url: { type: "text", notNull: true },
    transaction_type: { type: "varchar(20)", notNull: true },
    property_type: { type: "varchar(100)" },
    title: { type: "varchar(500)", notNull: true },
    description: { type: "text" },
    price: { type: "numeric(14,2)" },
    price_period: { type: "varchar(20)" },
    currency: { type: "char(3)", notNull: true, default: "EUR" },
    surface_m2: { type: "numeric(10,2)" },
    rooms: { type: "smallint" },
    bedrooms: { type: "smallint" },
    bathrooms: { type: "smallint" },
    floor: { type: "varchar(50)" },
    total_floors: { type: "smallint" },
    elevator: { type: "boolean" },
    furnished: { type: "boolean" },
    property_condition: { type: "varchar(150)" },
    heating: { type: "varchar(255)" },
    energy_class: { type: "varchar(50)" },
    condominium_fees: { type: "numeric(12,2)" },
    availability: { type: "varchar(150)" },
    advertiser_name: { type: "varchar(255)" },
    advertiser_type: { type: "varchar(80)" },
    location_label: { type: "varchar(500)" },
    address: { type: "text" },
    street: { type: "varchar(255)" },
    civic_number: { type: "varchar(30)" },
    district: { type: "varchar(150)" },
    municipality: { type: "varchar(150)" },
    province: { type: "varchar(100)" },
    region: { type: "varchar(100)" },
    postal_code: { type: "varchar(20)" },
    latitude: { type: "numeric(9,6)" },
    longitude: { type: "numeric(9,6)" },
    location_precision: { type: "varchar(30)" },
    main_image_url: { type: "text" },
    features: { type: "jsonb", notNull: true, default: pgm.func("'{}'::jsonb") },
    raw_data: { type: "jsonb", notNull: true, default: pgm.func("'{}'::jsonb") },
    source_published_at: { type: "timestamptz" },
    source_updated_at: { type: "timestamptz" },
    first_scraped_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
    last_scraped_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
    saved_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
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

  pgm.addConstraint("saved_listings", "saved_listings_source_external_id_uq", {
    unique: ["source_id", "external_id"],
  });
  pgm.addConstraint("saved_listings", "saved_listings_source_url_uq", {
    unique: ["source_id", "source_url"],
  });
  pgm.addConstraint("saved_listings", "saved_listings_transaction_type_ck", {
    check: "transaction_type IN ('rent', 'sale')",
  });
  pgm.addConstraint("saved_listings", "saved_listings_price_period_ck", {
    check: "price_period IS NULL OR price_period IN ('month', 'week', 'day', 'total')",
  });
  pgm.addConstraint("saved_listings", "saved_listings_location_precision_ck", {
    check:
      "location_precision IS NULL OR location_precision IN ('exact', 'approximate', 'area', 'unknown')",
  });
  pgm.addConstraint("saved_listings", "saved_listings_price_ck", {
    check: "price IS NULL OR price >= 0",
  });

  pgm.createIndex("saved_listings", "saved_at", { name: "saved_listings_saved_at_idx" });
  pgm.createIndex("saved_listings", "transaction_type", {
    name: "saved_listings_transaction_type_idx",
  });
  pgm.createIndex("saved_listings", "price", {
    name: "saved_listings_price_idx",
    where: "price IS NOT NULL",
  });
  pgm.createIndex("saved_listings", "municipality", {
    name: "saved_listings_municipality_idx",
    where: "municipality IS NOT NULL",
  });
  pgm.createIndex("saved_listings", "province", {
    name: "saved_listings_province_idx",
    where: "province IS NOT NULL",
  });
};

exports.down = (pgm) => {
  pgm.dropTable("saved_listings");
};
