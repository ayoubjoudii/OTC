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
  <div class="nav-left">
    <?php if (!isset($_SESSION['user_id'])): ?>
      <!-- Logged-out: show Register + Login on the left -->
      <a href="register.php">Register</a>
      <a href="login.php">Login</a>
    <?php else: ?>
      <!-- Logged-in: put Gallery on the left -->
      <a href="index.php">Gallery</a>
      <a href="profile.php">My profile</a>
    <?php endif; ?>
  </div>

  <div class="nav-right">
    <?php if (isset($_SESSION['user_id'])): ?>
      <?php if (!empty($_SESSION['role']) && $_SESSION['role'] === 'artist'): ?>
        <a href="upload_artwork.php">Upload</a>
      <?php else: ?>
        <a href="become_artist.php">Become artist</a>
      <?php endif; ?>

      <a href="logout.php">Logout</a>
    <?php endif; ?>
  </div>
</nav>
<hr>
