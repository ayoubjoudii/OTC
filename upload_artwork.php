<?php
require 'db.php';
include 'header.php';

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'artist') {
    echo '<p>You must be logged in as an artist.</p>';
    include 'footer.php';
    exit;
}

// get artist id for this user
$stmt = $conn->prepare('SELECT id FROM artists WHERE user_id = ?');
$stmt->bind_param('i', $_SESSION['user_id']);
$stmt->execute();
$result = $stmt->get_result();
$artist = $result->fetch_assoc();

if (!$artist) {
    echo '<p>No artist profile found. Use "Become artist" first.</p>';
    include 'footer.php';
    exit;
}

$artist_id = $artist['id'];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $title = trim($_POST['title'] ?? '');
    $description = trim($_POST['description'] ?? '');
    $year = intval($_POST['year'] ?? 0);
    $medium = trim($_POST['medium'] ?? '');
    $style = trim($_POST['style'] ?? '');
    $is_public = isset($_POST['is_public']) ? 1 : 0;

    if ($title === '' || empty($_FILES['image']['name'])) {
        echo '<p style="color:red">Title and image are required.</p>';
    } else {
        $upload_dir = 'uploads/';
        $filename = time() . '_' . basename($_FILES['image']['name']);
        $target = $upload_dir . $filename;

        if (move_uploaded_file($_FILES['image']['tmp_name'], $target)) {
            $stmt = $conn->prepare(
                'INSERT INTO artworks
                 (artist_id, title, description, image_path, year, medium, style, is_public)
                 VALUES (?,?,?,?,?,?,?,?)'
            );
            $stmt->bind_param(
                'isssissi',
                $artist_id,
                $title,
                $description,
                $target,
                $year,
                $medium,
                $style,
                $is_public
            );
            if ($stmt->execute()) {
                echo '<p>Artwork uploaded.</p>';
            } else {
                echo '<p style="color:red">DB error.</p>';
            }
        } else {
            echo '<p style="color:red">Failed to move uploaded file.</p>';
        }
    }
}
?>

<h2>Upload artwork</h2>
<form method="post" enctype="multipart/form-data">
  <label>Title</label>
  <input type="text" name="title" required>
  <br>
  <label>Description</label>
  <textarea name="description"></textarea>
  <br>
  <label>Year</label>
  <input type="number" name="year">
  <br>
  <label>Medium</label>
  <input type="text" name="medium">
  <br>
  <label>Style</label>
  <input type="text" name="style">
  <br>
  <label>Image</label>
  <input type="file" name="image" accept="image/*" required>
  <br>
  <label>
    <input type="checkbox" name="is_public" checked> Public
  </label>
  <br>
  <button type="submit">Upload</button>
</form>

<?php include 'footer.php'; ?>
