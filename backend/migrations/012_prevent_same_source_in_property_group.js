exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
    DO $$
    DECLARE
      duplicate RECORD;
      new_group_id bigint;
    BEGIN
      FOR duplicate IN
        SELECT id, property_group_id
        FROM (
          SELECT
            id,
            property_group_id,
            row_number() OVER (
              PARTITION BY property_group_id, source_id
              ORDER BY id
            ) AS occurrence
          FROM saved_listings
        ) ranked
        WHERE occurrence > 1
      LOOP
        INSERT INTO property_groups (transaction_type, management_status)
        SELECT transaction_type, management_status
        FROM property_groups
        WHERE id = duplicate.property_group_id
        RETURNING id INTO new_group_id;

        UPDATE saved_listings
        SET property_group_id = new_group_id, updated_at = now()
        WHERE id = duplicate.id;
      END LOOP;
    END $$;
  `);

  pgm.createIndex("saved_listings", ["property_group_id", "source_id"], {
    name: "saved_listings_property_group_source_uq",
    unique: true,
  });
};

exports.down = (pgm) => {
  pgm.dropIndex("saved_listings", ["property_group_id", "source_id"], {
    name: "saved_listings_property_group_source_uq",
  });
};
