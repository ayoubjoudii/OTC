<?php
require 'db.php';
include 'header.php';

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'artist') {
    echo '<p>You must be logged in as an artist.</p>';
    include 'footer.php';
    exit;
}

// get artist id for this user
$stmt = $conn->prepare(
    'SELECT id FROM artists WHERE user_id = ?'
);
$stmt->bind_param('i', $_SESSION['user_id']);
$stmt->execute();
$result = $stmt->get_result();
$artist = $result->fetch_assoc();

if (!$artist) {
    echo '<p>No artist profile found.</p>';
    include 'footer.php';
    exit;
}

$artist_id = $artist['id'];

$stmt = $conn->prepare(
    'SELECT id, title, image_path, is_public, created_at
     FROM artworks
     WHERE artist_id = ?
     ORDER BY created_at DESC'
);
$stmt->bind_param('i', $artist_id);
$stmt->execute();
$artworks = $stmt->get_result();
?>

<h2>My artworks</h2>

<ul>
<?php while ($row = $artworks->fetch_assoc()): ?>
  <li class="artwork-row">
    <div class="artwork-row-left">
      <a href="artwork.php?id=<?php echo $row['id']; ?>">
        <?php echo htmlspecialchars($row['title']); ?>
      </a>
      <span class="artwork-status">
        (<?php echo $row['is_public'] ? 'public' : 'private'; ?>)
      </span>
    </div>

    <a class="delete-link"
       href="delete_artwork.php?id=<?php echo $row['id']; ?>"
       onclick="return confirm('Delete this artwork permanently?');">
      Delete
    </a>
  </li>
<?php endwhile; ?>
</ul>

<?php include 'footer.php'; ?>
