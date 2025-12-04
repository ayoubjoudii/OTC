<?php
require 'db.php';

if (!isset($_SESSION['user_id'])) {
    header('Location: login.php');
    exit;
}

$user_id = $_SESSION['user_id'];
$artwork_id = intval($_GET['artwork_id'] ?? 0);
$redirect = !empty($_GET['from']) && $_GET['from'] === 'profile'
    ? 'profile.php'
    : 'artwork.php?id=' . $artwork_id;

if ($artwork_id <= 0) {
    header('Location: ' . $redirect);
    exit;
}

// check if already favorited
$stmt = $conn->prepare(
    'SELECT 1 FROM favorites WHERE user_id = ? AND artwork_id = ?'
);
$stmt->bind_param('ii', $user_id, $artwork_id);
$stmt->execute();
$stmt->store_result();

if ($stmt->num_rows > 0) {
    // unfavorite
    $stmt->close();
    $stmt = $conn->prepare(
        'DELETE FROM favorites WHERE user_id = ? AND artwork_id = ?'
    );
    $stmt->bind_param('ii', $user_id, $artwork_id);
    $stmt->execute();
    $stmt->close();
} else {
    // favorite
    $stmt->close();
    $stmt = $conn->prepare(
        'INSERT INTO favorites (user_id, artwork_id) VALUES (?, ?)'
    );
    $stmt->bind_param('ii', $user_id, $artwork_id);
    $stmt->execute();
    $stmt->close();
}

header('Location: ' . $redirect);
exit;
