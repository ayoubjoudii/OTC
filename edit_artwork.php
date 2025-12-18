<?php
require 'db.php';

// must be logged in as artist
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'artist') {
    header('Location: login.php');
    exit;
}

$artwork_id = intval($_GET['id'] ?? 0);
if ($artwork_id <= 0) {
    header('Location: profile.php');
    exit;
}

// find artist id for this user
$stmt = $conn->prepare('SELECT id FROM artists WHERE user_id = ?');
$stmt->bind_param('i', $_SESSION['user_id']);
$stmt->execute();
$res = $stmt->get_result();
$artist = $res->fetch_assoc();
$stmt->close();

if (!$artist) {
    header('Location: profile.php');
    exit;
}

$artist_id = $artist['id'];

// handle form submit (UPDATE)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $title = trim($_POST['title'] ?? '');
    $description = trim($_POST['description'] ?? '');
    $year = strlen($_POST['year'] ?? '') ? intval($_POST['year']) : null;
    $medium = trim($_POST['medium'] ?? '');
    $style = trim($_POST['style'] ?? '');
    $is_public = isset($_POST['is_public']) ? 1 : 0;

    if ($title === '') {
        $error = 'Title is required.';
    } else {
        $stmt = $conn->prepare(
            'UPDATE artworks
             SET title = ?, description = ?, year = ?, medium = ?, style = ?, is_public = ?
             WHERE id = ? AND artist_id = ?'
        );
        // year may be null; use i or null as int
        $stmt->bind_param(
            'ssissiii',
            $title,
            $description,
            $year,
            $medium,
            $style,
            $is_public,
            $artwork_id,
            $artist_id
        );
        $stmt->execute();
        $stmt->close();

        header('Location: profile.php');
        exit;
    }
}

// load artwork for form (only if owned by this artist)
$stmt = $conn->prepare(
    'SELECT * FROM artworks WHERE id = ? AND artist_id = ?'
);
$stmt->bind_param('ii', $artwork_id, $artist_id);
$stmt->execute();
$res = $stmt->get_result();
$art = $res->fetch_assoc();
$stmt->close();

if (!$art) {
    echo 'Artwork not found.';
    exit;
}

include 'header.php';
?>

<h2>Edit artwork</h2>

<?php if (!empty($error)): ?>
  <p style="color:#f87171;"><?php echo htmlspecialchars($error); ?></p>
<?php endif; ?>

<form method="post">
  <label>Title</label>
  <input type="text" name="title"
         value="<?php echo htmlspecialchars($art['title']); ?>" required>

  <label>Description</label>
  <textarea name="description"><?php
    echo htmlspecialchars($art['description']);
  ?></textarea>

  <label>Year</label>
  <input type="number" name="year"
         value="<?php echo htmlspecialchars($art['year']); ?>">

  <label>Medium</label>
  <input type="text" name="medium"
         value="<?php echo htmlspecialchars($art['medium']); ?>">

  <label>Style</label>
  <input type="text" name="style"
         value="<?php echo htmlspecialchars($art['style']); ?>">

  <label>
    <input type="checkbox" name="is_public"
      <?php echo $art['is_public'] ? 'checked' : ''; ?>>
    Public
  </label>

  <button type="submit">Save changes</button>
</form>

<?php include 'footer.php'; ?>
