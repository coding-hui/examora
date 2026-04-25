use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
struct SavePayload {
    session_id: String,
    payload: String,
}

#[tauri::command]
fn get_device_id() -> String {
    Uuid::new_v4().to_string()
}

#[tauri::command]
fn enter_exam_mode(window: tauri::Window) -> Result<(), String> {
    window.set_fullscreen(true).map_err(|err| err.to_string())?;
    window.set_always_on_top(true).map_err(|err| err.to_string())?;
    Ok(())
}

#[tauri::command]
fn exit_exam_mode(window: tauri::Window) -> Result<(), String> {
    window.set_fullscreen(false).map_err(|err| err.to_string())?;
    window.set_always_on_top(false).map_err(|err| err.to_string())?;
    Ok(())
}

#[tauri::command]
fn save_local_answer(input: SavePayload) -> Result<(), String> {
    if input.session_id.is_empty() {
        return Err("session_id is required".into());
    }

    if input.payload.is_empty() {
        return Err("payload is required".into());
    }

    Ok(())
}

#[tauri::command]
fn load_local_answer(session_id: String) -> Result<String, String> {
    if session_id.is_empty() {
        return Err("session_id is required".into());
    }

    Ok("{}".to_string())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_device_id,
            enter_exam_mode,
            exit_exam_mode,
            save_local_answer,
            load_local_answer
        ])
        .run(tauri::generate_context!())
        .expect("failed to run examora desktop shell");
}
