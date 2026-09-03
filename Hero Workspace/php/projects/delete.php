<?php

require_once "../config/database.php";
require_once "../config/app.php";
require_once "../api/response.php";

$userId = requireLogin();

$data = getRequestData();

$projectId = $data["project_id"] ?? null;

if (!$projectId) {
    errorResponse("Project ID is required.");
}

$stmt = $pdo->prepare(
    "DELETE FROM projects
     WHERE id = ?
     AND user_id = ?"
);

$stmt->execute([
    $projectId,
    $userId
]);

if ($stmt->rowCount() === 0) {
    errorResponse("Project not found.", 404);
}

successResponse(
    "Project deleted successfully."
);