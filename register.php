<?php
require 'db.php';
include 'header.php';

$errors = [];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';
    $password2 = $_POST['password2'] ?? '';

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $errors[] = 'Invalid email';
    }
    if (strlen($password) < 6) {
        $errors[] = 'Password must be at least 6 characters';
    }
    if ($password !== $password2) {
        $errors[] = 'Passwords do not match';
    }

    if (!$errors) {
        $stmt = $conn->prepare('SELECT id FROM users WHERE email = ?');
        $stmt->bind_param('s', $email);
        $stmt->execute();
        $stmt->store_result();
        if ($stmt->num_rows > 0) {
            $errors[] = 'Email already registered';
        } else {
            $hash = password_hash($password, PASSWORD_DEFAULT);
            $stmt = $conn->prepare(
                'INSERT INTO users (email, password_hash) VALUES (?, ?)'
            );
            $stmt->bind_param('ss', $email, $hash);
            if ($stmt->execute()) {
                echo '<p>Registration successful. <a href="login.php">Login</a></p>';
            } else {
                $errors[] = 'DB error';
            }
        }
    }
}
?>

<h2>Register</h2>
<?php foreach ($errors as $e) echo '<p style="color:red">'.htmlspecialchars($e).'</p>'; ?>

<form method="post">
  <label>Email</label>
  <input type="email" name="email" required>
  <br>
  <label>Password</label>
  <input type="password" name="password" required>
  <br>
  <label>Repeat password</label>
  <input type="password" name="password2" required>
  <br>
  <button type="submit">Register</button>
</form>

<?php include 'footer.php'; ?>
