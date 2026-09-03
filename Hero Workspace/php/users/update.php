<?php

require_once "../config/database.php";
require_once "../config/app.php";
require_once "../api/response.php";

$userId = requireLogin();

$data = getRequestData();

$name = trim($data["name"] ?? "");
$bio = trim($data["bio"] ?? "");

if ($name === "") {
    errorResponse("Name cannot be empty.");
}

$stmt = $pdo->prepare(
    "UPDATE users
     SET name = ?, bio = ?
     WHERE id = ?"
);

$stmt->execute([
    $name,
    $bio,
    $userId
]);

$_SESSION["user_name"] = $name;

successResponse("Profile updated successfully.");