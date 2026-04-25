mod error;
mod routes;

use axum::{extract::State, response::Json, routing::get, Router};
use chrono::{DateTime, Utc};
use routes::auth::me;
use serde::Serialize;
use std::{net::SocketAddr, sync::Arc};
use tower_http::trace::TraceLayer;
use tracing::info;

#[derive(Clone)]
struct AppState {
    service_name: &'static str,
    started_at: DateTime<Utc>,
    #[allow(dead_code)]
    logto_endpoint: String,
    logto_app_id: String,
    logto_jwks_uri: String,
}

#[derive(Serialize)]
struct HealthResponse {
    service: &'static str,
    status: &'static str,
    started_at: DateTime<Utc>,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(
            std::env::var("RUST_LOG")
                .unwrap_or_else(|_| "examora_api=debug,tower_http=info".into()),
        )
        .init();

    let logto_endpoint = std::env::var("LOGTO_ENDPOINT")
        .unwrap_or_else(|_| "https://auth.micromoving.net/".into());
    let logto_app_id = std::env::var("LOGTO_APP_ID")
        .unwrap_or_else(|_| "<YOUR_APP_ID>".into());
    let logto_jwks_uri = format!("{}/oidc/jwks", logto_endpoint.trim_end_matches('/'));

    let state = Arc::new(AppState {
        service_name: "examora-api",
        started_at: Utc::now(),
        logto_endpoint,
        logto_app_id,
        logto_jwks_uri,
    });

    let app = Router::new()
        .route("/health", get(health))
        .route("/api/health", get(health))
        .route("/api/auth/me", get(me))
        .with_state(state)
        .layer(TraceLayer::new_for_http());

    let addr: SocketAddr = "0.0.0.0:8080".parse()?;
    info!("starting examora-api on {addr}");

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}

async fn health(State(state): State<Arc<AppState>>) -> Json<HealthResponse> {
    Json(HealthResponse {
        service: state.service_name,
        status: "ok",
        started_at: state.started_at,
    })
}
