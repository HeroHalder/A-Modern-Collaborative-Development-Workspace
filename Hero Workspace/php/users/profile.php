<?php

require_once "../config/database.php";
require_once "../config/app.php";
require_once "../api/response.php";

$userId = requireLogin();

$stmt = $pdo->prepare(
    "SELECT id, name, email, bio, avatar, created_at
     FROM users
     WHERE id = ?"
);

$stmt->execute([$userId]);

$user = $stmt->fetch();

if (!$user) {
    errorResponse("User not found.", 404);
}

successResponse(
    "Profile loaded.",
    $user
);