<?php

require_once "../config/database.php";
require_once "../config/app.php";
require_once "../api/response.php";

$userId = requireLogin();

$projectId = $_GET["id"] ?? null;

if (!$projectId) {
    errorResponse("Project ID is required.");
}

$stmt = $pdo->prepare(
    "SELECT
        id,
        name,
        description,
        language,
        created_at,
        updated_at
     FROM projects
     WHERE id = ?
     AND user_id = ?"
);

$stmt->execute([
    $projectId,
    $userId
]);

$project = $stmt->fetch();

if (!$project) {
    errorResponse("Project not found.", 404);
}

$stmt = $pdo->prepare(
    "SELECT
        id,
        filename,
        content,
        language,
        created_at,
        updated_at
     FROM project_files
     WHERE project_id = ?
     ORDER BY filename"
);

$stmt->execute([$projectId]);

$files = $stmt->fetchAll();

$project["files"] = $files;

successResponse(
    "Project loaded.",
    $project
);