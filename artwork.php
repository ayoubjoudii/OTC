<?php
require 'db.php';

// optional: require login to see artwork + comments
if (!isset($_SESSION['user_id'])) {
    header('Location: login.php');
    exit;
}

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
$stmt->close();



if (!$art) {
    include 'header.php';
    echo '<h2>Artwork not found.</h2>';
    include 'footer.php';
    exit;
}

// ----- handle new comment submission -----
$comment_error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['comment_content'])) {
    $content = trim($_POST['comment_content']);

    if ($content === '') {
        $comment_error = 'Comment cannot be empty.';
    } else {
        $user_id = $_SESSION['user_id'];

        $stmt = $conn->prepare(
            'INSERT INTO comments (user_id, artwork_id, content)
             VALUES (?,?,?)'
        );
        $stmt->bind_param('iis', $user_id, $id, $content);
        $stmt->execute();
        $stmt->close();

        // simple redirect to avoid form resubmission
        header('Location: artwork.php?id=' . $id);
        exit;
    }
}

// ----- fetch comments for this artwork -----
$stmt = $conn->prepare(
    'SELECT c.content, c.created_at, u.email
     FROM comments c
     JOIN users u ON c.user_id = u.id
     WHERE c.artwork_id = ?
     ORDER BY c.created_at DESC'
);
$stmt->bind_param('i', $id);
$stmt->execute();
$comments = $stmt->get_result();
$stmt->close();

$is_favorited = false;

if (isset($_SESSION['user_id'])) {
    $stmt = $conn->prepare(
        'SELECT 1 FROM favorites WHERE user_id = ? AND artwork_id = ?'
    );
    $stmt->bind_param('ii', $_SESSION['user_id'], $id);
    $stmt->execute();
    $stmt->store_result();
    $is_favorited = $stmt->num_rows > 0;
    $stmt->close();
}


include 'header.php';
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
      <?php if (isset($_SESSION['user_id'])): ?>
        <p class="artwork-website">
          <a class="fav-button"
            href="toggle_favorite.php?artwork_id=<?php echo $id; ?>">
            <?php echo $is_favorited ? '★ Remove from favorites' : '☆ Add to favorites'; ?>
          </a>
        </p>
      <?php endif; ?>
  </div>
</div>



<div class="comments-wrapper">
  <h2>Comments</h2>

  <?php if ($comment_error): ?>
    <p class="comment-error"><?php echo htmlspecialchars($comment_error); ?></p>
  <?php endif; ?>

  <form method="post" class="comment-form">
    <label for="comment_content">Add a comment</label>
    <textarea id="comment_content" name="comment_content" required></textarea>
    <button type="submit">Post comment</button>
  </form>

  <div class="comments-list">
    <?php if ($comments->num_rows === 0): ?>
      <p class="no-comments">No comments yet. Be the first.</p>
    <?php else: ?>
      <?php while ($c = $comments->fetch_assoc()): ?>
        <div class="comment">
          <p class="comment-meta">
            <?php echo htmlspecialchars($c['email']); ?>
            •
            <?php echo htmlspecialchars($c['created_at']); ?>
          </p>
          <p class="comment-content">
            <?php echo nl2br(htmlspecialchars($c['content'])); ?>
          </p>
        </div>
      <?php endwhile; ?>
    <?php endif; ?>
  </div>
</div>

<?php include 'footer.php'; ?>
