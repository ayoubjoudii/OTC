<?php
require 'db.php';

// Require login and artist role
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'artist') {
    header('Location: login.php');
    exit;
}

$artwork_id = intval($_GET['id'] ?? 0);

if ($artwork_id <= 0) {
    header('Location: my_artworks.php');
    exit;
}

// Get this artist id from user_id
$stmt = $conn->prepare('SELECT id FROM artists WHERE user_id = ?');
$stmt->bind_param('i', $_SESSION['user_id']);
$stmt->execute();
$res = $stmt->get_result();
$artist = $res->fetch_assoc();
$stmt->close();

if (!$artist) {
    header('Location: my_artworks.php');
    exit;
}

$artist_id = $artist['id'];

// Load artwork and check ownership
$stmt = $conn->prepare(
    'SELECT image_path FROM artworks WHERE id = ? AND artist_id = ?'
);
$stmt->bind_param('ii', $artwork_id, $artist_id);
$stmt->execute();
$res = $stmt->get_result();
$art = $res->fetch_assoc();
$stmt->close();

if (!$art) {
    // Artwork not found or not owned by this artist
    header('Location: my_artworks.php');
    exit;
}

// Delete related comments first (foreign key constraint)
$stmt = $conn->prepare('DELETE FROM comments WHERE artwork_id = ?');
$stmt->bind_param('i', $artwork_id);
$stmt->execute();
$stmt->close();

// Delete related favorites
$stmt = $conn->prepare('DELETE FROM favorites WHERE artwork_id = ?');
$stmt->bind_param('i', $artwork_id);
$stmt->execute();
$stmt->close();

// Delete artwork row
$stmt = $conn->prepare('DELETE FROM artworks WHERE id = ? AND artist_id = ?');
$stmt->bind_param('ii', $artwork_id, $artist_id);
$stmt->execute();
$stmt->close();

// Delete image file if it exists
$image_path = $art['image_path'];
if ($image_path && file_exists($image_path)) {
    // Remove file from filesystem
    @unlink($image_path); // suppress warning if it fails
}

header('Location: my_artworks.php');
exit;
