<<<<<<< HEAD
<?php
require 'db.php';

if (!isset($_SESSION['user_id'])) {
    header('Location: login.php');
    exit;
}

$user_id = $_SESSION['user_id'];
$success = '';
$error = '';

// load current data
$stmt = $conn->prepare(
    'SELECT email, name, profile_image, password_hash
     FROM users WHERE id = ?'
);
$stmt->bind_param('i', $user_id);
$stmt->execute();
$res = $stmt->get_result();
$user = $res->fetch_assoc();
$stmt->close();

if (!$user) {
    echo 'User not found.';
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = trim($_POST['name'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $current_password = $_POST['current_password'] ?? '';
    $new_password = $_POST['new_password'] ?? '';
    $new_password2 = $_POST['new_password2'] ?? '';

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $error = 'Invalid email.';
    } elseif ($name === '') {
        $error = 'Name is required.';
    } else {
        // handle profile image upload (optional)
        $profile_image = $user['profile_image'];

        if (!empty($_FILES['profile_image']['name'])) {
            $upload_dir = 'uploads/';
            $filename = time() . '_profile_' . basename($_FILES['profile_image']['name']);
            $target = $upload_dir . $filename;

            if (move_uploaded_file($_FILES['profile_image']['tmp_name'], $target)) {
                // delete old image if exists
                if ($profile_image && file_exists($profile_image)) {
                    @unlink($profile_image);
                }
                $profile_image = $target;
            } else {
                $error = 'Failed to upload profile image.';
            }
        }

        // optional password change
        $update_password_sql = '';
        $params = [];
        $types = '';

        if (!$error && $new_password !== '' ) {
            if (strlen($new_password) < 6) {
                $error = 'New password must be at least 6 characters.';
            } elseif ($new_password !== $new_password2) {
                $error = 'New passwords do not match.';
            } elseif (!password_verify($current_password, $user['password_hash'])) {
                $error = 'Current password is incorrect.';
            } else {
                $new_hash = password_hash($new_password, PASSWORD_DEFAULT);
                $update_password_sql = ', password_hash = ?';
                $params[] = $new_hash;
                $types .= 's';
            }
        }

        if (!$error) {
            // update name, email, profile_image (+ maybe password)
            $sql = 'UPDATE users
                    SET name = ?, email = ?, profile_image = ?'
                    . $update_password_sql .
                   ' WHERE id = ?';

            $params = array_merge([$name, $email, $profile_image], $params, [$user_id]);
            $types = 'sssi' . ($update_password_sql ? 's' : '');

            // build dynamic bind
            $stmt = $conn->prepare($sql);
            $stmt->bind_param($types, ...$params);
            $stmt->execute();
            $stmt->close();

            $_SESSION['success_message'] = 'Profile updated.';
            header('Location: profile.php');
            exit;
        }
    }
}

include 'header.php';
?>

<h2>Edit my profile</h2>

<?php if ($error): ?>
  <p style="color:#f87171;"><?php echo htmlspecialchars($error); ?></p>
<?php endif; ?>

<form method="post" enctype="multipart/form-data">
  <label>Name</label>
  <input type="text" name="name"
         value="<?php echo htmlspecialchars($user['name']); ?>" required>

  <label>Email</label>
  <input type="email" name="email"
         value="<?php echo htmlspecialchars($user['email']); ?>" required>

  <label>Profile image (optional)</label>
  <input type="file" name="profile_image" accept="image/*">

  <p style="margin-top:8px; font-size:0.85rem; color:#9ca3af;">
    Leave password fields empty if you do not want to change your password.
  </p>

  <label>Current password</label>
  <input type="password" name="current_password">

  <label>New password</label>
  <input type="password" name="new_password">

  <label>Repeat new password</label>
  <input type="password" name="new_password2">

  <button type="submit">Save profile</button>
</form>

<?php include 'footer.php'; ?>
=======
<?php
require 'db.php';

if (!isset($_SESSION['user_id'])) {
    header('Location: login.php');
    exit;
}

$user_id = $_SESSION['user_id'];
$success = '';
$error = '';

// load current data
$stmt = $conn->prepare(
    'SELECT email, name, profile_image, password_hash
     FROM users WHERE id = ?'
);
$stmt->bind_param('i', $user_id);
$stmt->execute();
$res = $stmt->get_result();
$user = $res->fetch_assoc();
$stmt->close();

if (!$user) {
    echo 'User not found.';
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = trim($_POST['name'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $current_password = $_POST['current_password'] ?? '';
    $new_password = $_POST['new_password'] ?? '';
    $new_password2 = $_POST['new_password2'] ?? '';

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $error = 'Invalid email.';
    } elseif ($name === '') {
        $error = 'Name is required.';
    } else {
        // handle profile image upload (optional)
        $profile_image = $user['profile_image'];

        if (!empty($_FILES['profile_image']['name'])) {
            $upload_dir = 'uploads/';
            $filename = time() . '_profile_' . basename($_FILES['profile_image']['name']);
            $target = $upload_dir . $filename;

            if (move_uploaded_file($_FILES['profile_image']['tmp_name'], $target)) {
                // delete old image if exists
                if ($profile_image && file_exists($profile_image)) {
                    @unlink($profile_image);
                }
                $profile_image = $target;
            } else {
                $error = 'Failed to upload profile image.';
            }
        }

        // optional password change
        $update_password_sql = '';
        $params = [];
        $types = '';

        if (!$error && $new_password !== '' ) {
            if (strlen($new_password) < 6) {
                $error = 'New password must be at least 6 characters.';
            } elseif ($new_password !== $new_password2) {
                $error = 'New passwords do not match.';
            } elseif (!password_verify($current_password, $user['password_hash'])) {
                $error = 'Current password is incorrect.';
            } else {
                $new_hash = password_hash($new_password, PASSWORD_DEFAULT);
                $update_password_sql = ', password_hash = ?';
                $params[] = $new_hash;
                $types .= 's';
            }
        }

        if (!$error) {
            // update name, email, profile_image (+ maybe password)
            $sql = 'UPDATE users
                    SET name = ?, email = ?, profile_image = ?'
                    . $update_password_sql .
                   ' WHERE id = ?';

            $params = array_merge([$name, $email, $profile_image], $params, [$user_id]);
            $types = 'sssi' . ($update_password_sql ? 's' : '');

            // build dynamic bind
            $stmt = $conn->prepare($sql);
            $stmt->bind_param($types, ...$params);
            $stmt->execute();
            $stmt->close();

            $_SESSION['success_message'] = 'Profile updated.';
            header('Location: profile.php');
            exit;
        }
    }
}

include 'header.php';
?>

<h2>Edit my profile</h2>

<?php if ($error): ?>
  <p style="color:#f87171;"><?php echo htmlspecialchars($error); ?></p>
<?php endif; ?>

<form method="post" enctype="multipart/form-data">
  <label>Name</label>
  <input type="text" name="name"
         value="<?php echo htmlspecialchars($user['name']); ?>" required>

  <label>Email</label>
  <input type="email" name="email"
         value="<?php echo htmlspecialchars($user['email']); ?>" required>

  <label>Profile image (optional)</label>
  <input type="file" name="profile_image" accept="image/*">

  <p style="margin-top:8px; font-size:0.85rem; color:#9ca3af;">
    Leave password fields empty if you do not want to change your password.
  </p>

  <label>Current password</label>
  <input type="password" name="current_password">

  <label>New password</label>
  <input type="password" name="new_password">

  <label>Repeat new password</label>
  <input type="password" name="new_password2">

  <button type="submit">Save profile</button>
</form>

<?php include 'footer.php'; ?>
>>>>>>> 7c8a6ab786767865c2277cee896bacc38a50d8b2
