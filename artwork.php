<?php
require 'db.php';
include 'header.php';

$id = intval($_GET['id'] ?? 0);

$stmt = $conn->prepare(
    'SELECT aw.*, ar.display_name, ar.bio, ar.website
     FROM artworks aw
     JOIN artists ar ON aw.artist_id = ar.id
     WHERE aw.id = ? AND aw.is_public = 1'
);
$stmt->bind_param('i', $id);
$stmt->execute();
$result = $stmt->get_result();
$art = $result->fetch_assoc();

if (!$art) {
    echo '<h2>Artwork not found.</h2>';
    include 'footer.php';
    exit;
}
?>

<div class="artwork-page">
  <div class="artwork-image">
    <img
      class="artwork-large"
      src="<?php echo htmlspecialchars($art['image_path']); ?>"
      alt="<?php echo htmlspecialchars($art['title']); ?>"
    >
  </div>

  <div class="artwork-info">
    <h2><?php echo htmlspecialchars($art['title']); ?></h2>

    <?php if (!empty($art['description'])): ?>
      <p class="artwork-description">
        <?php echo nl2br(htmlspecialchars($art['description'])); ?>
      </p>
    <?php endif; ?>

    <?php if (!empty($art['year'])): ?>
      <p class="artwork-artist">
        Year: <?php echo htmlspecialchars($art['year']); ?>
      </p>
    <?php endif; ?>

    <?php if (!empty($art['medium'])): ?>
      <p class="artwork-artist">
        Medium: <?php echo htmlspecialchars($art['medium']); ?>
      </p>
    <?php endif; ?>

    <?php if (!empty($art['style'])): ?>
      <p class="artwork-artist">
        Style: <?php echo htmlspecialchars($art['style']); ?>
      </p>
    <?php endif; ?>

    <p class="artwork-artist">
      Artist: <?php echo htmlspecialchars($art['display_name']); ?>
    </p>

    <?php if (!empty($art['website'])): ?>
      <p class="artwork-website">
        Website:
        <a href="<?php echo htmlspecialchars($art['website']); ?>" target="_blank">
          <?php echo htmlspecialchars($art['website']); ?>
        </a>
      </p>
    <?php endif; ?>
  </div>
</div>

<?php include 'footer.php'; ?>
