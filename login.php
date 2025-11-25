<?php
require 'db.php';
include 'header.php';

$errors = [];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';

    $stmt = $conn->prepare(
        'SELECT id, password_hash, role FROM users WHERE email = ?'
    );
    $stmt->bind_param('s', $email);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();

    if ($user && password_verify($password, $user['password_hash'])) {
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['role'] = $user['role'];
        header('Location: index.php');
        exit;
    } else {
        $errors[] = 'Invalid email or password';
    }
}
?>

<h2>Login</h2>
<?php foreach ($errors as $e) echo '<p style="color:red">'.htmlspecialchars($e).'</p>'; ?>

<form method="post">
  <label>Email</label>
  <input type="email" name="email" required>
  <br>
  <label>Password</label>
  <input type="password" name="password" required>
  <br>
  <button type="submit">Login</button>
</form>

<?php include 'footer.php'; ?>
