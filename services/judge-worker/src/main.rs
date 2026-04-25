use chrono::Utc;
use tracing::info;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(
            std::env::var("RUST_LOG")
                .unwrap_or_else(|_| "examora_judge_worker=debug".to_string()),
        )
        .init();

    info!(
        service = "examora-judge-worker",
        started_at = %Utc::now(),
        "worker bootstrap complete"
    );
    info!("mock judge mode is the default for MVP bootstrap");

    tokio::signal::ctrl_c().await?;
    info!("shutting down examora-judge-worker");

    Ok(())
}
