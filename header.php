<?php
// header.php
require_once 'config.php';
?>
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Online Gallery</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
<nav>
  <a href="index.php">Gallery</a>

  <?php if (isset($_SESSION['user_id'])): ?>

    <?php if (!empty($_SESSION['role']) && $_SESSION['role'] === 'artist'): ?>
      <!-- Artist nav -->
      <a href="my_artworks.php">My artworks</a>
      <a href="upload_artwork.php">Upload</a>
    <?php else: ?>
      <!-- Normal user (can become artist) -->
      <a href="become_artist.php">Become artist</a>
    <?php endif; ?>

    <a href="logout.php">Logout</a>

  <?php else: ?>

    <a href="register.php">Register</a>
    <a href="login.php">Login</a>

  <?php endif; ?>
</nav>
<hr>
