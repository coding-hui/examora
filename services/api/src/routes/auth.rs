use axum::{extract::State, Json};
use jsonwebtoken::{decode, decode_header, jwk::JwkSet, Algorithm, DecodingKey, Validation};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use std::time::Duration;

use crate::error::AppError;
use crate::AppState;

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,
    pub role: Option<String>,
    pub exp: usize,
    pub aud: Option<String>,
    pub iss: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct AuthMeResponse {
    pub user_id: String,
    pub role: Option<String>,
}

async fn fetch_jwks(jwks_uri: &str) -> Result<JwkSet, AppError> {
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(10))
        .build()
        .map_err(|e| AppError::InternalError(format!("Failed to build HTTP client: {}", e)))?;

    let response = client
        .get(jwks_uri)
        .send()
        .await
        .map_err(|e| AppError::InternalError(format!("Failed to fetch JWKS: {}", e)))?;

    let jwks: JwkSet = response
        .json()
        .await
        .map_err(|e| AppError::InternalError(format!("Failed to parse JWKS: {}", e)))?;

    Ok(jwks)
}

pub async fn me(
    State(state): State<Arc<AppState>>,
    authorization: Option<String>,
) -> Result<Json<AuthMeResponse>, AppError> {
    let auth_header = authorization
        .ok_or_else(|| AppError::Unauthorized("Missing authorization header".into()))?;

    let token = auth_header
        .strip_prefix("Bearer ")
        .ok_or_else(|| AppError::Unauthorized("Invalid authorization header format".into()))?;

    // Decode header to get key id
    let header =
        decode_header(token).map_err(|_| AppError::Unauthorized("Invalid token header".into()))?;

    let kid = header
        .kid
        .ok_or_else(|| AppError::Unauthorized("Token missing key id".into()))?;

    // Fetch and cache JWKS (in production, cache this)
    let jwks = fetch_jwks(&state.logto_jwks_uri).await?;

    // Find the matching key
    let jwk = jwks
        .find(&kid)
        .ok_or_else(|| AppError::Unauthorized("Unknown key id".into()))?;

    // Create decoding key from JWK
    let decoding_key = DecodingKey::from_jwk(jwk)
        .map_err(|e| AppError::InternalError(format!("Invalid JWK: {}", e)))?;

    let mut validation = Validation::new(Algorithm::RS256);
    validation.set_audience(&[&state.logto_app_id]);

    let token_data = decode::<Claims>(token, &decoding_key, &validation)
        .map_err(|_| AppError::Unauthorized("Invalid token".into()))?;

    Ok(Json(AuthMeResponse {
        user_id: token_data.claims.sub,
        role: token_data.claims.role,
    }))
}
