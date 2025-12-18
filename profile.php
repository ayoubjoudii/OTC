<?php
require 'db.php';

if (!isset($_SESSION['user_id'])) {
    header('Location: login.php');
    exit;
}

$user_id = $_SESSION['user_id'];

// load user info
$stmt = $conn->prepare(
    'SELECT email, name, profile_image, role, created_at
     FROM users
     WHERE id = ?'
);
$stmt->bind_param('i', $user_id);
$stmt->execute();
$result = $stmt->get_result();
$user = $result->fetch_assoc();
$stmt->close();

// favorites for this user
$favorites = null;
$stmt = $conn->prepare(
    'SELECT aw.id, aw.title, aw.image_path, ar.display_name
     FROM favorites f
     JOIN artworks aw ON f.artwork_id = aw.id
     JOIN artists ar ON aw.artist_id = ar.id
     WHERE f.user_id = ?
     ORDER BY f.created_at DESC'
);
$stmt->bind_param('i', $user_id);
$stmt->execute();
$favorites = $stmt->get_result();
$stmt->close();

// if user is artist, load their artworks (same logic as my_artworks.php)
$artworks = null;
if (!empty($_SESSION['role']) && $_SESSION['role'] === 'artist') {
    // get artist id
    $stmt = $conn->prepare('SELECT id FROM artists WHERE user_id = ?');
    $stmt->bind_param('i', $user_id);
    $stmt->execute();
    $res = $stmt->get_result();
    $artist = $res->fetch_assoc();
    $stmt->close();

    if ($artist) {
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
    }
}

include 'header.php';
?>

<h2>My profile</h2>

<div class="profile-card">
  <div class="profile-edit-icon">
    <a class="profile-edit-button" href="edit_profile.php" title="Edit profile">
      🖌
    </a>
  </div>

  <div class="profile-avatar">
    <?php if (!empty($user['profile_image']) && file_exists($user['profile_image'])): ?>
      <img src="<?php echo htmlspecialchars($user['profile_image']); ?>" alt="Profile picture">
    <?php else: ?>
      <div class="avatar-placeholder">
        <?php
          $initial = strtoupper(substr($user['email'], 0, 1));
          echo htmlspecialchars($initial);
        ?>
      </div>
    <?php endif; ?>
  </div>

  <div class="profile-info">
    <p><strong>Name:</strong> <?php echo htmlspecialchars($user['name'] ?? 'Not set'); ?></p>
    <p><strong>Email:</strong> <?php echo htmlspecialchars($user['email']); ?></p>
    <p><strong>Role:</strong> <?php echo htmlspecialchars($user['role']); ?></p>
    <p><strong>Member since:</strong> <?php echo htmlspecialchars($user['created_at']); ?></p>
  </div>
</div>


<?php if ($favorites && $favorites->num_rows > 0): ?>
  <h2>My favorites</h2>
  <div class="grid">
    <?php while ($fav = $favorites->fetch_assoc()): ?>
      <div class="item">
        <a href="artwork.php?id=<?php echo $fav['id']; ?>">
          <img src="<?php echo htmlspecialchars($fav['image_path']); ?>" alt="">
          <p><?php echo htmlspecialchars($fav['title']); ?></p>
          <p>by <?php echo htmlspecialchars($fav['display_name']); ?></p>
        </a>
      </div>
    <?php endwhile; ?>
  </div>
<?php else: ?>
  <h2>My favorites</h2>
  <p style="text-align:center; color:#9ca3af; margin-bottom:24px;">
    You haven’t favorited any artworks yet.
  </p>
<?php endif; ?>


<?php if (!empty($_SESSION['role']) && $_SESSION['role'] === 'artist' && $artworks): ?>
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

      <div class="artwork-row-actions">
        <a class="edit-link"
           href="edit_artwork.php?id=<?php echo $row['id']; ?>">
          Edit
        </a>

        <a class="delete-link"
           href="delete_artwork.php?id=<?php echo $row['id']; ?>"
           onclick="return confirm('Delete this artwork permanently?');">
          Delete
        </a>
      </div>
    </li>
  <?php endwhile; ?>
  </ul>
<?php endif; ?>

<?php include 'footer.php'; ?>
