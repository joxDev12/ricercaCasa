async function replaceForListing(queryable, listingId, images) {
  await queryable.query("DELETE FROM listing_images WHERE listing_id = $1", [
    listingId,
  ]);

  for (const image of images) {
    await queryable.query(
      `INSERT INTO listing_images (
        listing_id,
        image_url,
        alt_text,
        position,
        is_primary
      ) VALUES ($1, $2, $3, $4, $5)`,
      [
        listingId,
        image.imageUrl,
        image.altText,
        image.position,
        image.isPrimary,
      ]
    );
  }
}

async function findByListingId(queryable, listingId) {
  const result = await queryable.query(
    `SELECT
      image_url AS "imageUrl",
      alt_text AS "altText",
      position,
      is_primary AS "isPrimary"
     FROM listing_images
     WHERE listing_id = $1
     ORDER BY position ASC, id ASC`,
    [listingId]
  );

  return result.rows;
}

module.exports = { findByListingId, replaceForListing };
