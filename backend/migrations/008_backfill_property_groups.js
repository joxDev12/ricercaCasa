exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
    WITH listing_rows AS (
      SELECT
        id,
        transaction_type,
        created_at,
        updated_at,
        row_number() OVER (ORDER BY id) AS row_num
      FROM saved_listings
      WHERE property_group_id IS NULL
    ),
    inserted_groups AS (
      INSERT INTO property_groups (
        transaction_type,
        management_status,
        created_at,
        updated_at
      )
      SELECT
        transaction_type,
        'saved',
        created_at,
        updated_at
      FROM listing_rows
      ORDER BY row_num
      RETURNING id
    ),
    numbered_groups AS (
      SELECT id, row_number() OVER (ORDER BY id) AS row_num
      FROM inserted_groups
    )
    UPDATE saved_listings sl
    SET property_group_id = ng.id
    FROM listing_rows lr
    JOIN numbered_groups ng ON ng.row_num = lr.row_num
    WHERE sl.id = lr.id
  `);

  pgm.sql(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM saved_listings
        WHERE property_group_id IS NULL
      ) THEN
        RAISE EXCEPTION 'Backfill property_group_id incompleto';
      END IF;
    END $$;
  `);

  pgm.alterColumn("saved_listings", "property_group_id", { notNull: true });
  pgm.addConstraint("saved_listings", "saved_listings_property_group_id_fk", {
    foreignKeys: {
      columns: "property_group_id",
      references: "property_groups(id)",
      onDelete: "RESTRICT",
    },
  });
};

exports.down = (pgm) => {
  pgm.sql(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT property_group_id
        FROM saved_listings
        GROUP BY property_group_id
        HAVING COUNT(*) > 1
      ) THEN
        RAISE EXCEPTION 'Rollback 008 non sicuro: esistono property_groups con piu listing';
      END IF;
    END $$;
  `);

  pgm.dropConstraint("saved_listings", "saved_listings_property_group_id_fk");
  pgm.alterColumn("saved_listings", "property_group_id", { notNull: false });
  pgm.sql(`
    DELETE FROM property_groups pg
    WHERE NOT EXISTS (
      SELECT 1
      FROM saved_listings sl
      WHERE sl.property_group_id = pg.id
    )
  `);
  pgm.sql(`UPDATE saved_listings SET property_group_id = NULL`);
  pgm.sql(`DELETE FROM property_groups`);
};
