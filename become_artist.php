<?php
require 'db.php';
include 'header.php';

if (!isset($_SESSION['user_id'])) {
    echo '<p>You must be logged in.</p>';
    include 'footer.php';
    exit;
}

$user_id = $_SESSION['user_id'];

if (!empty($_SESSION['role']) && $_SESSION['role'] === 'artist') {
    echo '<p>You are already an artist.</p>';
    include 'footer.php';
    exit;
}


if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $display_name = trim($_POST['display_name'] ?? '');
    $bio = trim($_POST['bio'] ?? '');
    $website = trim($_POST['website'] ?? '');

    if ($display_name === '') {
        echo '<p style="color:red">Display name required</p>';
    } else {
        // Check if artist row already exists
        $stmt = $conn->prepare('SELECT id FROM artists WHERE user_id = ?');
        $stmt->bind_param('i', $user_id);
        $stmt->execute();
        $stmt->store_result();

        if ($stmt->num_rows === 0) {
            $stmt = $conn->prepare(
                'INSERT INTO artists (user_id, display_name, bio, website)
                 VALUES (?,?,?,?)'
            );
            $stmt->bind_param('isss', $user_id, $display_name, $bio, $website);
            if ($stmt->execute()) {
                // update user role
                $role = 'artist';
                $stmt2 = $conn->prepare(
                    'UPDATE users SET role = ? WHERE id = ?'
                );
                $stmt2->bind_param('si', $role, $user_id);
                $stmt2->execute();
                $_SESSION['role'] = 'artist';
                echo '<p>You are now an artist.</p>';
            } else {
                echo '<p style="color:red">Error saving artist.</p>';
            }
        } else {
            echo '<p>You already have an artist profile.</p>';
        }
    }
}
?>

<h2>Become an artist</h2>

<form method="post">
  <label>Display name</label>
  <input type="text" name="display_name" required>
  <br>
  <label>Bio</label>
  <textarea name="bio"></textarea>
  <br>
  <label>Website</label>
  <input type="url" name="website">
  <br>
  <button type="submit">Save</button>
</form>

<?php include 'footer.php'; ?>
