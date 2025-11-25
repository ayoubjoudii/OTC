<?php
require 'db.php';
include 'header.php';

$sql = "SELECT aw.id, aw.title, aw.image_path, ar.display_name
        FROM artworks aw
        JOIN artists ar ON aw.artist_id = ar.id
        WHERE aw.is_public = 1
        ORDER BY aw.created_at DESC
        LIMIT 100";

$result = $conn->query($sql);
?>

<h2>Gallery</h2>

<div class="grid">
<?php while ($row = $result->fetch_assoc()): ?>
  <div class="item">
    <a href="artwork.php?id=<?php echo $row['id']; ?>">
      <img src="<?php echo htmlspecialchars($row['image_path']); ?>" alt=""
           style="max-width:200px;">
      <p><?php echo htmlspecialchars($row['title']); ?></p>
      <p>by <?php echo htmlspecialchars($row['display_name']); ?></p>
    </a>
  </div>
<?php endwhile; ?>
</div>

<?php include 'footer.php'; ?>
