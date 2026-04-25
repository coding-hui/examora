use serde::{Deserialize, Serialize};
use thiserror::Error;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SandboxLimits {
    pub cpu_time_ms: u64,
    pub wall_time_ms: u64,
    pub memory_mb: u64,
    pub process_limit: u32,
    pub output_limit_kb: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SandboxCommand {
    pub executable: String,
    pub args: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SandboxJob {
    pub language: String,
    pub compile: Option<SandboxCommand>,
    pub run: SandboxCommand,
    pub limits: SandboxLimits,
    pub stdin_path: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SandboxResult {
    pub status: SandboxStatus,
    pub stdout: String,
    pub stderr: String,
    pub time_ms: u64,
    pub memory_kb: u64,
    pub exit_code: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SandboxStatus {
    Accepted,
    CompilationError,
    RuntimeError,
    TimeLimitExceeded,
    MemoryLimitExceeded,
    OutputLimitExceeded,
    SystemError,
}

#[derive(Debug, Error)]
pub enum SandboxError {
    #[error("sandbox runner is not implemented yet")]
    Unimplemented,
}

pub fn run_job(_job: &SandboxJob) -> Result<SandboxResult, SandboxError> {
    Err(SandboxError::Unimplemented)
}
