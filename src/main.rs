use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::{IntoResponse, Json},
    routing::get,
    Router,
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tower_http::cors::CorsLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

#[derive(Debug, Serialize, Deserialize, Clone)]
struct ScoreEntry {
    i: String,
    v: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct DiscordData {
    category: String,
    server_id: String,
    seed: Vec<ScoreEntry>,
    scores: Vec<ScoreEntry>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct GithubData {
    category: String,
    ecosystem: String,
    seed: Vec<ScoreEntry>,
    scores: Vec<ScoreEntry>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct TelegramData {
    category: String,
    channel_id: String,
    seed: Vec<ScoreEntry>,
    scores: Vec<ScoreEntry>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct XData {
    category: String,
    community_id: String,
    seed: Vec<ScoreEntry>,
    scores: Vec<ScoreEntry>,
}

#[derive(Debug, Deserialize)]
struct PaginationParams {
    start: Option<usize>,
    size: Option<usize>,
}

#[derive(Clone)]
struct AppState {
    discord_data: Arc<HashMap<String, DiscordData>>,
    github_data: Arc<HashMap<String, GithubData>>,
    telegram_data: Arc<HashMap<String, TelegramData>>,
    x_data: Arc<HashMap<String, XData>>,
}

// Discord handlers
async fn get_discord_file(
    State(state): State<AppState>,
    Path(file_name): Path<String>,
) -> impl IntoResponse {
    match state.discord_data.get(&file_name) {
        Some(data) => (StatusCode::OK, Json(data.clone())).into_response(),
        None => (StatusCode::NOT_FOUND, "File not found").into_response(),
    }
}

async fn get_discord_seed(
    State(state): State<AppState>,
    Path(file_name): Path<String>,
) -> impl IntoResponse {
    match state.discord_data.get(&file_name) {
        Some(data) => (StatusCode::OK, Json(&data.seed)).into_response(),
        None => (StatusCode::NOT_FOUND, "File not found").into_response(),
    }
}

async fn get_discord_server_id(
    State(state): State<AppState>,
    Path(file_name): Path<String>,
) -> impl IntoResponse {
    match state.discord_data.get(&file_name) {
        Some(data) => (
            StatusCode::OK,
            Json(serde_json::json!({ "server_id": data.server_id })),
        )
            .into_response(),
        None => (StatusCode::NOT_FOUND, "File not found").into_response(),
    }
}

async fn get_discord_scores(
    State(state): State<AppState>,
    Path(file_name): Path<String>,
    Query(params): Query<PaginationParams>,
) -> impl IntoResponse {
    match state.discord_data.get(&file_name) {
        Some(data) => {
            let start = params.start.unwrap_or(0);
            let size = params.size.unwrap_or(data.scores.len());
            let end = (start + size).min(data.scores.len());

            let paginated_scores: Vec<_> = data.scores[start..end].to_vec();
            (StatusCode::OK, Json(paginated_scores)).into_response()
        }
        None => (StatusCode::NOT_FOUND, "File not found").into_response(),
    }
}

// GitHub handlers
async fn get_github_file(
    State(state): State<AppState>,
    Path(file_name): Path<String>,
) -> impl IntoResponse {
    match state.github_data.get(&file_name) {
        Some(data) => (StatusCode::OK, Json(data.clone())).into_response(),
        None => (StatusCode::NOT_FOUND, "File not found").into_response(),
    }
}

async fn get_github_seed(
    State(state): State<AppState>,
    Path(file_name): Path<String>,
) -> impl IntoResponse {
    match state.github_data.get(&file_name) {
        Some(data) => (StatusCode::OK, Json(&data.seed)).into_response(),
        None => (StatusCode::NOT_FOUND, "File not found").into_response(),
    }
}

async fn get_github_ecosystem(
    State(state): State<AppState>,
    Path(file_name): Path<String>,
) -> impl IntoResponse {
    match state.github_data.get(&file_name) {
        Some(data) => (
            StatusCode::OK,
            Json(serde_json::json!({ "ecosystem": data.ecosystem })),
        )
            .into_response(),
        None => (StatusCode::NOT_FOUND, "File not found").into_response(),
    }
}

async fn get_github_scores(
    State(state): State<AppState>,
    Path(file_name): Path<String>,
    Query(params): Query<PaginationParams>,
) -> impl IntoResponse {
    match state.github_data.get(&file_name) {
        Some(data) => {
            let start = params.start.unwrap_or(0);
            let size = params.size.unwrap_or(data.scores.len());
            let end = (start + size).min(data.scores.len());

            let paginated_scores: Vec<_> = data.scores[start..end].to_vec();
            (StatusCode::OK, Json(paginated_scores)).into_response()
        }
        None => (StatusCode::NOT_FOUND, "File not found").into_response(),
    }
}

// Telegram handlers
async fn get_telegram_file(
    State(state): State<AppState>,
    Path(file_name): Path<String>,
) -> impl IntoResponse {
    match state.telegram_data.get(&file_name) {
        Some(data) => (StatusCode::OK, Json(data.clone())).into_response(),
        None => (StatusCode::NOT_FOUND, "File not found").into_response(),
    }
}

async fn get_telegram_seed(
    State(state): State<AppState>,
    Path(file_name): Path<String>,
) -> impl IntoResponse {
    match state.telegram_data.get(&file_name) {
        Some(data) => (StatusCode::OK, Json(&data.seed)).into_response(),
        None => (StatusCode::NOT_FOUND, "File not found").into_response(),
    }
}

async fn get_telegram_channel_id(
    State(state): State<AppState>,
    Path(file_name): Path<String>,
) -> impl IntoResponse {
    match state.telegram_data.get(&file_name) {
        Some(data) => (
            StatusCode::OK,
            Json(serde_json::json!({ "channel_id": data.channel_id })),
        )
            .into_response(),
        None => (StatusCode::NOT_FOUND, "File not found").into_response(),
    }
}

async fn get_telegram_scores(
    State(state): State<AppState>,
    Path(file_name): Path<String>,
    Query(params): Query<PaginationParams>,
) -> impl IntoResponse {
    match state.telegram_data.get(&file_name) {
        Some(data) => {
            let start = params.start.unwrap_or(0);
            let size = params.size.unwrap_or(data.scores.len());
            let end = (start + size).min(data.scores.len());

            let paginated_scores: Vec<_> = data.scores[start..end].to_vec();
            (StatusCode::OK, Json(paginated_scores)).into_response()
        }
        None => (StatusCode::NOT_FOUND, "File not found").into_response(),
    }
}

// X (Twitter) handlers
async fn get_x_file(
    State(state): State<AppState>,
    Path(file_name): Path<String>,
) -> impl IntoResponse {
    match state.x_data.get(&file_name) {
        Some(data) => (StatusCode::OK, Json(data.clone())).into_response(),
        None => (StatusCode::NOT_FOUND, "File not found").into_response(),
    }
}

async fn get_x_seed(
    State(state): State<AppState>,
    Path(file_name): Path<String>,
) -> impl IntoResponse {
    match state.x_data.get(&file_name) {
        Some(data) => (StatusCode::OK, Json(&data.seed)).into_response(),
        None => (StatusCode::NOT_FOUND, "File not found").into_response(),
    }
}

async fn get_x_community_id(
    State(state): State<AppState>,
    Path(file_name): Path<String>,
) -> impl IntoResponse {
    match state.x_data.get(&file_name) {
        Some(data) => (
            StatusCode::OK,
            Json(serde_json::json!({ "community_id": data.community_id })),
        )
            .into_response(),
        None => (StatusCode::NOT_FOUND, "File not found").into_response(),
    }
}

async fn get_x_scores(
    State(state): State<AppState>,
    Path(file_name): Path<String>,
    Query(params): Query<PaginationParams>,
) -> impl IntoResponse {
    match state.x_data.get(&file_name) {
        Some(data) => {
            let start = params.start.unwrap_or(0);
            let size = params.size.unwrap_or(data.scores.len());
            let end = (start + size).min(data.scores.len());

            let paginated_scores: Vec<_> = data.scores[start..end].to_vec();
            (StatusCode::OK, Json(paginated_scores)).into_response()
        }
        None => (StatusCode::NOT_FOUND, "File not found").into_response(),
    }
}

fn load_data() -> AppState {
    let mut discord_data = HashMap::new();
    let mut github_data = HashMap::new();
    let mut telegram_data = HashMap::new();
    let mut x_data = HashMap::new();

    // Load Discord data
    if let Ok(entries) = std::fs::read_dir("datasets/discord") {
        for entry in entries.flatten() {
            if let Ok(content) = std::fs::read_to_string(entry.path()) {
                if let Ok(data) = serde_json::from_str::<DiscordData>(&content) {
                    let file_name = entry.file_name().to_string_lossy().replace(".json", "");
                    discord_data.insert(file_name, data);
                }
            }
        }
    }

    // Load GitHub data
    if let Ok(entries) = std::fs::read_dir("datasets/github") {
        for entry in entries.flatten() {
            if let Ok(content) = std::fs::read_to_string(entry.path()) {
                if let Ok(data) = serde_json::from_str::<GithubData>(&content) {
                    let file_name = entry.file_name().to_string_lossy().replace(".json", "");
                    github_data.insert(file_name, data);
                }
            }
        }
    }

    // Load Telegram data
    if let Ok(entries) = std::fs::read_dir("datasets/telegram") {
        for entry in entries.flatten() {
            if let Ok(content) = std::fs::read_to_string(entry.path()) {
                if let Ok(data) = serde_json::from_str::<TelegramData>(&content) {
                    let file_name = entry.file_name().to_string_lossy().replace(".json", "");
                    telegram_data.insert(file_name, data);
                }
            }
        }
    }

    // Load X data
    if let Ok(entries) = std::fs::read_dir("datasets/x") {
        for entry in entries.flatten() {
            if let Ok(content) = std::fs::read_to_string(entry.path()) {
                if let Ok(data) = serde_json::from_str::<XData>(&content) {
                    let file_name = entry.file_name().to_string_lossy().replace(".json", "");
                    x_data.insert(file_name, data);
                }
            }
        }
    }

    AppState {
        discord_data: Arc::new(discord_data),
        github_data: Arc::new(github_data),
        telegram_data: Arc::new(telegram_data),
        x_data: Arc::new(x_data),
    }
}

#[tokio::main]
async fn main() {
    // Initialize tracing
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "openrank_api=debug,tower_http=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Load data from files
    let state = load_data();

    tracing::info!("Loaded {} Discord datasets", state.discord_data.len());
    tracing::info!("Loaded {} GitHub datasets", state.github_data.len());
    tracing::info!("Loaded {} Telegram datasets", state.telegram_data.len());
    tracing::info!("Loaded {} X datasets", state.x_data.len());

    // Build the router
    let app = Router::new()
        // Discord routes
        .route("/discord/:file_name", get(get_discord_file))
        .route("/discord/:file_name/seed", get(get_discord_seed))
        .route("/discord/:file_name/server_id", get(get_discord_server_id))
        .route("/discord/:file_name/scores", get(get_discord_scores))
        // GitHub routes
        .route("/github/:file_name", get(get_github_file))
        .route("/github/:file_name/seed", get(get_github_seed))
        .route("/github/:file_name/ecosystem", get(get_github_ecosystem))
        .route("/github/:file_name/scores", get(get_github_scores))
        // Telegram routes
        .route("/telegram/:file_name", get(get_telegram_file))
        .route("/telegram/:file_name/seed", get(get_telegram_seed))
        .route(
            "/telegram/:file_name/channel_id",
            get(get_telegram_channel_id),
        )
        .route("/telegram/:file_name/scores", get(get_telegram_scores))
        // X routes
        .route("/x/:file_name", get(get_x_file))
        .route("/x/:file_name/seed", get(get_x_seed))
        .route("/x/:file_name/community_id", get(get_x_community_id))
        .route("/x/:file_name/scores", get(get_x_scores))
        .layer(CorsLayer::permissive())
        .with_state(state);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    tracing::info!("Server listening on {}", listener.local_addr().unwrap());

    axum::serve(listener, app).await.unwrap();
}
